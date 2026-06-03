import { useState, useEffect } from 'react'
import './modal-consultar-pacientes-estilos.css'
import { gerarPdfConsulta } from '../../utils/gerarPDF'

type Etapa = 'busca' | 'perfil' | 'novo-prontuario'

interface ConsultaHistorico {
    id: number
    data: string
    medico: string
    score: number
    recomendacao: string
    sintomas: string[]
    observacoes: string
}

interface Paciente {
    id: number
    cpf: string
    nome: string
    sexo: string
    data_nascimento: string
    telefone: string
    email: string
}

interface Sintoma {
    id: number
    nome: string
}

function calcularIdade(dataNascimento: string) {
    const hoje = new Date()
    const nascimento = new Date(dataNascimento)
    let idade = hoje.getFullYear() - nascimento.getFullYear()
    const m = hoje.getMonth() - nascimento.getMonth()
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--
    }
    return idade
}

interface Props {
    onFechar: () => void
}

export function ModalConsultarPacientes({ onFechar }: Props) {
    const [etapa, setEtapa] = useState<Etapa>('busca')
    const [cpf, setCpf] = useState('')
    const [paciente, setPaciente] = useState<Paciente | null>(null)
    const [historico, setHistorico] = useState<ConsultaHistorico[]>([])
    const [sintomasList, setSintomasList] = useState<Sintoma[]>([])
    const [resultadoBusca, setResultadoBusca] = useState<'não encontrado' | 'sem acesso' | null>(null)
    const [medicoDono, setMedicoDono] = useState('')
    
    // Novo Prontuário
    const [sintomasMarcados, setSintomasMarcados] = useState<number[]>([])
    const [queixaPrincipal, setQueixaPrincipal] = useState('')
    const [diagnostico, setDiagnostico] = useState('')
    const [prescricao, setPrescricao] = useState('')
    const [observacoes, setObservacoes] = useState('')
    const [dataConsulta, setDataConsulta] = useState(new Date().toISOString().split('T')[0])
    
    const [loading, setLoading] = useState(false)
    const [prontuarioSalvo, setProntuarioSalvo] = useState(false)
    const [triagemGeradaId, setTriagemGeradaId] = useState<number | null>(null)

    useEffect(() => {
        fetch('/api/sintomas')
            .then(res => res.json())
            .then(data => setSintomasList(data))
            .catch(err => console.error("Erro ao carregar sintomas", err))
    }, [])

    const buscarPaciente = async () => {
        setLoading(true)
        setResultadoBusca(null)
        try {
            const response = await fetch('/api/paciente/buscar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cpf })
            })
            const data = await response.json()
            if (data.found) {
                if (data.sem_acesso) {
                    setResultadoBusca('sem acesso')
                    setMedicoDono(data.medico_nome)
                } else {
                    setPaciente(data.paciente)
                    fetchHistorico(data.paciente.id)
                    setEtapa('perfil')
                }
            } else {
                setResultadoBusca('não encontrado')
            }
        } catch (err) {
            console.error(err)
            alert('Erro ao buscar paciente')
        } finally {
            setLoading(false)
        }
    }

    const fetchHistorico = async (pacienteId: number) => {
        try {
            const res = await fetch(`/api/historico/${pacienteId}`)
            const data = await res.json()
            setHistorico(data)
        } catch (err) {
            console.error("Erro ao carregar histórico", err)
        }
    }

    const toggleSintoma = (id: number) => {
        setSintomasMarcados(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        )
    }

    const salvarProntuario = async () => {
        if (!paciente) return
        setLoading(true)
        
        const sintomasObj: Record<string, boolean> = {}
        sintomasMarcados.forEach(id => {
            sintomasObj[id.toString()] = true
        })

        const obsCompleta = [
            queixaPrincipal && `Queixa: ${queixaPrincipal}`,
            diagnostico && `Diagnóstico: ${diagnostico}`,
            prescricao && `Prescrição: ${prescricao}`,
            observacoes
        ].filter(Boolean).join('\n\n')

        try {
            const response = await fetch('/api/triagem/calcular', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paciente_id: paciente.id,
                    sintomas: sintomasObj,
                    observacoes: obsCompleta
                })
            })
            const data = await response.json()
            if (data.triagem_id) {
                setTriagemGeradaId(data.triagem_id)
                setProntuarioSalvo(true)
                fetchHistorico(paciente.id)
            } else {
                alert('Erro ao salvar prontuário')
            }
        } catch (err) {
            console.error(err)
            alert('Erro de conexão')
        } finally {
            setLoading(false)
        }
    }

    const resetFormulario = () => {
        setProntuarioSalvo(false)
        setSintomasMarcados([])
        setQueixaPrincipal('')
        setDiagnostico('')
        setPrescricao('')
        setObservacoes('')
        setTriagemGeradaId(null)
    }

    const voltarParaBusca = () => {
        setEtapa('busca')
        setPaciente(null)
        setCpf('')
        setResultadoBusca(null)
        resetFormulario()
    }

    const modalClass = [
        'modal',
        etapa === 'perfil' ? 'modal-largo' : '',
        etapa === 'novo-prontuario' ? 'modal-medio' : '',
    ].join(' ').trim()

    return (
        <div className='overlay' onClick={onFechar}>
            <div className={modalClass} onClick={(e) => e.stopPropagation()}>

                {/* ── ETAPA: BUSCA ─────────────────────────────────── */}
                {etapa === 'busca' && (
                    <>
                        <div className='modal-header'>
                            <h2>Consultar Paciente</h2>
                            <button className='botao-fechar' onClick={onFechar}>✕</button>
                        </div>

                        <div className='modal-corpo'>
                            <label className='consulta-label'>CPF do paciente</label>
                            <input
                                className='consulta-input'
                                type="text"
                                placeholder="000.000.000-00"
                                value={cpf}
                                onChange={(e) => setCpf(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && buscarPaciente()}
                            />
                            <button className='botao-buscar' onClick={buscarPaciente} disabled={loading}>
                                {loading ? 'Buscando...' : 'Buscar'}
                            </button>
                        </div>

                        {resultadoBusca === 'não encontrado' && (
                            <div className='resultado-nao-encontrado'>
                                <p>Nenhum paciente encontrado com esse CPF.</p>
                            </div>
                        )}
                        {resultadoBusca === 'sem acesso' && (
                            <div className='resultado-nao-encontrado'>
                                <p>Este paciente está sob os cuidados de <strong>{medicoDono}</strong>.</p>
                                <p>Você não tem permissão para visualizar estes dados.</p>
                            </div>
                        )}
                    </>
                )}

                {/* ── ETAPA: PERFIL ─────────────────────────────────── */}
                {etapa === 'perfil' && paciente && (
                    <>
                        <div className='modal-header'>
                            <div className='modal-header-nav'>
                                <button className='botao-voltar' onClick={voltarParaBusca}>← Voltar</button>
                                <h2>Ficha do Paciente</h2>
                            </div>
                            <button className='botao-fechar' onClick={onFechar}>✕</button>
                        </div>

                        <div className='perfil-paciente'>
                            <div className='perfil-avatar'>{paciente.nome.charAt(0)}</div>
                            <div className='perfil-info'>
                                <h3 className='perfil-nome'>{paciente.nome}</h3>
                                <div className='perfil-detalhes'>
                                    <span>CPF: {paciente.cpf}</span>
                                    <span className='perfil-sep'>·</span>
                                    <span>{calcularIdade(paciente.data_nascimento)} anos</span>
                                    <span className='perfil-sep'>·</span>
                                    <span>{paciente.sexo}</span>
                                    <span className='perfil-sep'>·</span>
                                    <span>Nasc.: {paciente.data_nascimento.split('-').reverse().join('/')}</span>
                                </div>
                            </div>
                        </div>

                        <div className='historico-header'>
                            <h3>Histórico de Consultas</h3>
                            <button className='botao-novo-prontuario' onClick={() => { resetFormulario(); setEtapa('novo-prontuario'); }}>
                                + Iniciar Novo Prontuário
                            </button>
                        </div>

                        <div className='historico-lista'>
                            {historico.length === 0 ? <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Nenhuma triagem realizada anteriormente.</p> : historico.map((h, i) => (
                                <div key={i} className='historico-item'>
                                    <div className='historico-item-topo'>
                                        <div className='historico-item-data'>
                                            <span className='historico-data'>{h.data}</span>
                                            <span className='historico-medico'>Dr(a). {h.medico}</span>
                                        </div>
                                        <button
                                            className='botao-gerar-pdf'
                                            onClick={() => {
                                                window.open(`/api/triagem/imprimir/${h.id}`, '_blank')
                                            }}
                                        >
                                            Gerar PDF
                                        </button>
                                    </div>
                                    <div className='historico-item-sintomas'>
                                        {h.sintomas.map((s, j) => (
                                            <span key={j} className='sintoma-tag'>{s}</span>
                                        ))}
                                    </div>
                                    <p className='historico-obs'>{h.observacoes}</p>
                                    <div style={{ marginTop: '8px', fontSize: '13px' }}>
                                        <strong>Score:</strong> {h.score.toFixed(3)} — <em>{h.recomendacao}</em>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* ── ETAPA: NOVO PRONTUÁRIO ─────────────────────────── */}
                {etapa === 'novo-prontuario' && paciente && (
                    <>
                        <div className='modal-header'>
                            <div className='modal-header-nav'>
                                <button className='botao-voltar' onClick={() => setEtapa('perfil')}>← Voltar ao perfil</button>
                                <h2>Novo Prontuário</h2>
                            </div>
                            <button className='botao-fechar' onClick={onFechar}>✕</button>
                        </div>

                        {prontuarioSalvo ? (
                            <div className='prontuario-salvo'>
                                <div className='prontuario-salvo-icone'>✓</div>
                                <h3>Prontuário salvo com sucesso!</h3>
                                <p>O prontuário de <strong>{paciente.nome}</strong> foi registrado.</p>
                                <div className='prontuario-salvo-acoes'>
                                    <button
                                        className='botao-gerar-pdf'
                                        onClick={() => {
                                            if (triagemGeradaId) window.open(`/api/triagem/imprimir/${triagemGeradaId}`, '_blank')
                                        }}
                                    >
                                        Gerar PDF da Consulta
                                    </button>
                                    <button className='botao-voltar-perfil' onClick={() => setEtapa('perfil')}>
                                        Voltar ao perfil
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className='prontuario-paciente-mini'>
                                    <span className='prontuario-paciente-nome'>{paciente.nome}</span>
                                    <span className='prontuario-paciente-info'>
                                        {paciente.cpf} · {calcularIdade(paciente.data_nascimento)} anos · {paciente.sexo}
                                    </span>
                                </div>

                                <div className='prontuario-campos-wrapper'>
                                    <div className='prontuario-campo'>
                                        <label className='consulta-label'>Data da consulta</label>
                                        <input
                                            className='consulta-input'
                                            type="date"
                                            value={dataConsulta}
                                            onChange={(e) => setDataConsulta(e.target.value)}
                                        />
                                    </div>

                                    <div className='prontuario-campo'>
                                        <label className='consulta-label'>Queixa principal</label>
                                        <input
                                            className='consulta-input'
                                            type="text"
                                            placeholder="Descreva a queixa principal do paciente"
                                            value={queixaPrincipal}
                                            onChange={(e) => setQueixaPrincipal(e.target.value)}
                                        />
                                    </div>

                                    <div className='prontuario-campo'>
                                        <label className='consulta-label'>Diagnóstico</label>
                                        <textarea
                                            className='prontuario-textarea'
                                            placeholder="CID, conclusões clínicas, hipóteses diagnósticas..."
                                            value={diagnostico}
                                            onChange={(e) => setDiagnostico(e.target.value)}
                                            rows={3}
                                        />
                                    </div>

                                    <div className='prontuario-campo'>
                                        <label className='consulta-label'>Prescrição</label>
                                        <textarea
                                            className='prontuario-textarea'
                                            placeholder="Medicamentos, dosagens, orientações terapêuticas..."
                                            value={prescricao}
                                            onChange={(e) => setPrescricao(e.target.value)}
                                            rows={3}
                                        />
                                    </div>

                                    <div className='prontuario-sintomas'>
                                        <label className='consulta-label'>Sintomas observados</label>
                                        <p className='prontuario-sintomas-sub'>
                                            Selecione todos que se aplicam nesta consulta
                                        </p>
                                        <div className='sintomas-grid'>
                                            {sintomasList.map(s => (
                                                <label
                                                    key={s.id}
                                                    className={`sintoma-opcao ${sintomasMarcados.includes(s.id) ? 'sintoma-opcao-marcado' : ''}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className='sintoma-check'
                                                        checked={sintomasMarcados.includes(s.id)}
                                                        onChange={() => toggleSintoma(s.id)}
                                                    />
                                                    {s.nome}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className='prontuario-campo'>
                                        <label className='consulta-label'>
                                            Observações gerais
                                            <span className='prontuario-campo-hint'>campo livre</span>
                                        </label>
                                        <textarea
                                            className='prontuario-textarea prontuario-textarea-grande'
                                            placeholder="Evolução do paciente, encaminhamentos realizados, intercorrências, anotações adicionais..."
                                            value={observacoes}
                                            onChange={(e) => setObservacoes(e.target.value)}
                                            rows={5}
                                        />
                                    </div>
                                </div>

                                <div className='prontuario-rodape'>
                                    <button className='botao-cancelar' onClick={() => setEtapa('perfil')}>
                                        Cancelar
                                    </button>
                                    <button
                                        className='botao-salvar'
                                        onClick={salvarProntuario}
                                        disabled={loading || !queixaPrincipal.trim()}
                                    >
                                        {loading ? 'Salvando...' : 'Salvar Prontuário'}
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                )}

            </div>
        </div>
    )
}
