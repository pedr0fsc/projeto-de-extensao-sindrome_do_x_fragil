import { useState, useEffect } from 'react'
import './modal-consultar-pacientes-estilos.css'
import { formatarCPF, limparFormatacao } from '../../utils/mascaras'
import { useAlerta } from '../alerta'
import { ModalFotosPaciente } from '../modal-fotos-paciente'

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
    id_instituto: number | null
    instituicao?: string | null
    foto_face?: string | null
    foto_perfil_esq?: string | null
    foto_perfil_dir?: string | null
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
    const [modoEdicao, setModoEdicao] = useState(false)
    const [triagemEditandoId, setTriagemEditandoId] = useState<number | null>(null)
    const [sintomasList, setSintomasList] = useState<Sintoma[]>([])
    const [resultadoBusca, setResultadoBusca] = useState<'não encontrado' | 'sem acesso' | null>(null)
    const [medicoDono, setMedicoDono] = useState('')
    
    // Novo Prontuário
    const [sintomasMarcados, setSintomasMarcados] = useState<number[]>([])
    const [queixaPrincipal, setQueixaPrincipal] = useState('')
    const [diagnostico, setDiagnostico] = useState('')
    const [prescricao, setPrescricao] = useState('')
    const [informacoesPaciente, setInformacoesPaciente] = useState('')
    const [observacoes, setObservacoes] = useState('')
    const [dataConsulta, setDataConsulta] = useState(new Date().toISOString().split('T')[0])
    
    const [loading, setLoading] = useState(false)
    const [prontuarioSalvo, setProntuarioSalvo] = useState(false)
    const [modalFotosAberto, setModalFotosAberto] = useState(false)
    const { mostrarAlerta } = useAlerta()
    const [triagemGeradaId, setTriagemGeradaId] = useState<number | null>(null)

    useEffect(() => {
        fetch('/api/sintomas')
            .then(res => res.json())
            .then(data => setSintomasList(data))
            .catch(err => console.error("Erro ao carregar sintomas", err))
    }, [])

    const parsearObservacoes = (texto: string) => {
        const linhas = texto.split('\n\n').map(item => item.trim()).filter(Boolean)
        const queixa = linhas.find(item => /^Queixa:\s*/i.test(item))?.replace(/^Queixa:\s*/i, '').trim() || ''
        const diagnostico = linhas.find(item => /^Diagnóstico:\s*/i.test(item))?.replace(/^Diagnóstico:\s*/i, '').trim() || ''
        const prescricao = linhas.find(item => /^Prescrição:\s*/i.test(item))?.replace(/^Prescrição:\s*/i, '').trim() || ''
        const infoPaciente = linhas.find(item => /^Informações do paciente:\s*/i.test(item))?.replace(/^Informações do paciente:\s*/i, '').trim() || ''
        const gerais = linhas
            .filter(item => !/^(Queixa:|Diagnóstico:|Prescrição:|Informações do paciente:)/i.test(item))
            .join('\n\n')
            .trim()

        return { queixa, diagnostico, prescricao, infoPaciente, gerais }
    }

    const abrirEdicaoConsulta = (consulta: ConsultaHistorico) => {
        const dados = parsearObservacoes(consulta.observacoes)
        const sintomasSelecionados = consulta.sintomas
            .map(nome => sintomasList.find(item => item.nome === nome)?.id)
            .filter((id): id is number => typeof id === 'number')

        setModoEdicao(true)
        setTriagemEditandoId(consulta.id)
        setQueixaPrincipal(dados.queixa)
        setDiagnostico(dados.diagnostico)
        setPrescricao(dados.prescricao)
        setInformacoesPaciente(dados.infoPaciente)
        setObservacoes(dados.gerais)
        setSintomasMarcados(sintomasSelecionados)
        setDataConsulta(consulta.data.split(' ')[0].split('/').reverse().join('-'))
        setEtapa('novo-prontuario')
    }

    const buscarPaciente = async () => {
        setLoading(true)
        setResultadoBusca(null)
        try {
            const response = await fetch('/api/paciente/buscar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cpf: limparFormatacao(cpf) })
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
            mostrarAlerta('Erro ao buscar paciente', 'erro')
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
            informacoesPaciente && `Informações do paciente: ${informacoesPaciente}`,
            observacoes
        ].filter(Boolean).join('\n\n')

        try {
            const endpoint = modoEdicao && triagemEditandoId ? `/api/triagem/${triagemEditandoId}` : '/api/triagem/calcular'
            const method = modoEdicao && triagemEditandoId ? 'PUT' : 'POST'

            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: modoEdicao && triagemEditandoId
                    ? JSON.stringify({ observacoes: obsCompleta, data_consulta: dataConsulta })
                    : JSON.stringify({
                        paciente_id: paciente.id,
                        sintomas: sintomasObj,
                        observacoes: obsCompleta
                    })
            })
            const data = await response.json()
            if (data.triagem_id || data.success) {
                setTriagemGeradaId(data.triagem_id ?? triagemEditandoId)
                setProntuarioSalvo(true)
                fetchHistorico(paciente.id)
            } else {
                mostrarAlerta('Erro ao salvar prontuário', 'erro')
            }
        } catch (err) {
            console.error(err)
            mostrarAlerta('Erro de conexão', 'erro')
        } finally {
            setLoading(false)
        }
    }

    const resetFormulario = () => {
        setModoEdicao(false)
        setTriagemEditandoId(null)
        setProntuarioSalvo(false)
        setSintomasMarcados([])
        setQueixaPrincipal('')
        setDiagnostico('')
        setPrescricao('')
        setInformacoesPaciente('')
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
        <>
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
                                onChange={(e) => setCpf(formatarCPF(e.target.value))}
                                onKeyDown={(e) => e.key === 'Enter' && buscarPaciente()}
                                maxLength={14}
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
                            <div className='perfil-avatar-wrapper'>
                                {paciente.foto_face ? (
                                    <img src={paciente.foto_face} alt={paciente.nome} className='perfil-avatar-foto' />
                                ) : (
                                    <div className='perfil-avatar'>{paciente.nome.charAt(0)}</div>
                                )}
                                <button
                                    className='perfil-btn-fotos'
                                    onClick={() => setModalFotosAberto(true)}
                                    title="Ver todas as fotos"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                                    </svg>
                                </button>
                            </div>
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
                                    <span className='perfil-sep'>·</span>
                                    <span>Inst.: {paciente.instituicao || '-'}</span>
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
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                className='botao-gerar-pdf'
                                                onClick={() => {
                                                    window.open(`/api/triagem/imprimir/${h.id}`, '_blank')
                                                }}
                                            >
                                                Gerar PDF
                                            </button>
                                            <button
                                                className='botao-gerar-pdf'
                                                onClick={() => abrirEdicaoConsulta(h)}
                                                style={{ background: '#2C6975' }}
                                            >
                                                Editar
                                            </button>
                                        </div>
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
                                <h2>{modoEdicao ? 'Editar Consulta' : 'Novo Prontuário'}</h2>
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

                                    <div className='prontuario-campo'>
                                        <label className='consulta-label'>Informações do paciente</label>
                                        <textarea
                                            className='prontuario-textarea'
                                            placeholder="Histórico familiar, desenvolvimento, hábitos, cuidado domiciliar, observações adicionais..."
                                            value={informacoesPaciente}
                                            onChange={(e) => setInformacoesPaciente(e.target.value)}
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
                                        {loading ? 'Salvando...' : (modoEdicao ? 'Salvar alterações' : 'Salvar Prontuário')}
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                )}

            </div>
        </div>

        {modalFotosAberto && paciente && (
            <ModalFotosPaciente
                paciente={paciente}
                onFechar={() => setModalFotosAberto(false)}
            />
        )}
        </>
    )
}
