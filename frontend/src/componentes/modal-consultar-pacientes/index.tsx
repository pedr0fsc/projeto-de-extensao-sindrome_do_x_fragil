import { useState } from 'react'
import './modal-consultar-pacientes-estilos.css'
import { gerarPdfConsulta } from '../../utils/gerarPDF'

type Etapa = 'busca' | 'perfil' | 'novo-prontuario'

interface ConsultaHistorico {
    data: string
    medico: string
    sintomas: string[]
    observacoes: string
}

interface Paciente {
    cpf: string
    nome: string
    idade: number
    genero: string
    dataNascimento: string
    ultimaConsulta: string
    medico: string
    historico: ConsultaHistorico[]
}

const sintomasList = [
    { label: 'Deficiência intelectual', name: 'deficiencia_intelectual' },
    { label: 'Face alongada/orelha', name: 'face_alongada_orelha' },
    { label: 'Macroorquidismo', name: 'macroorquidismo' },
    { label: 'Hipermobilidade articular', name: 'hipermobilidade_articular' },
    { label: 'Dificuldades de aprendizagem', name: 'dificuldades_aprendizagem' },
    { label: 'Déficit de atenção', name: 'deficit_atencao' },
    { label: 'Mov. repetitivo', name: 'movimento_repetitivo' },
    { label: 'Atraso na fala', name: 'atraso_fala' },
    { label: 'Hiperatividade', name: 'hiperatividade' },
    { label: 'Evita contato visual', name: 'evita_contato_visual' },
    { label: 'Evita contato físico', name: 'evita_contato_fisico' },
    { label: 'Agressividade', name: 'agressividade' },
]

const pacientesMock: Paciente[] = [
    {
        cpf: '000.000.000-00',
        nome: 'João Silva',
        idade: 10,
        genero: 'Masculino',
        dataNascimento: '01/01/2016',
        ultimaConsulta: '20/05/2026',
        medico: 'Dr. Médico Responsável',
        historico: [
            {
                data: '20/05/2026',
                medico: 'Dr. Médico Responsável',
                sintomas: ['Deficiência intelectual', 'Atraso na fala', 'Hiperatividade'],
                observacoes: 'Paciente apresentou melhora no comportamento após intervenção terapêutica.',
            },
            {
                data: '10/01/2026',
                medico: 'Dr. Médico Responsável',
                sintomas: ['Deficiência intelectual', 'Dificuldades de aprendizagem'],
                observacoes: 'Iniciado acompanhamento fonoaudiológico semanal.',
            },
            {
                data: '05/08/2025',
                medico: 'Dr. Médico Responsável',
                sintomas: ['Atraso na fala', 'Evita contato visual', 'Mov. repetitivo'],
                observacoes: 'Encaminhado para avaliação neuropsicológica.',
            },
        ],
    },
    {
        cpf: '111.111.111-11',
        nome: 'Ana Costa',
        idade: 8,
        genero: 'Feminino',
        dataNascimento: '15/03/2018',
        ultimaConsulta: '18/05/2026',
        medico: 'Dr. Médico Responsável',
        historico: [
            {
                data: '18/05/2026',
                medico: 'Dr. Médico Responsável',
                sintomas: ['Hipermobilidade articular', 'Dificuldades de aprendizagem', 'Déficit de atenção'],
                observacoes: 'Iniciado acompanhamento fonoaudiológico semanal.',
            },
            {
                data: '12/11/2025',
                medico: 'Dra. Ana Lima',
                sintomas: ['Dificuldades de aprendizagem', 'Déficit de atenção'],
                observacoes: 'Consulta de rotina. Sem alterações significativas.',
            },
        ],
    },
    {
        cpf: '222.222.222-22',
        nome: 'Pedro Lima',
        idade: 12,
        genero: 'Masculino',
        dataNascimento: '22/07/2014',
        ultimaConsulta: '15/05/2026',
        medico: 'Dr. Médico Responsável',
        historico: [
            {
                data: '15/05/2026',
                medico: 'Dr. Médico Responsável',
                sintomas: ['Agressividade', 'Evita contato físico'],
                observacoes: 'Encaminhado para avaliação neuropsicológica.',
            },
        ],
    },
]

interface Props {
    onFechar: () => void
}

export function ModalConsultarPacientes({ onFechar }: Props) {
    const [etapa, setEtapa] = useState<Etapa>('busca')
    const [cpf, setCpf] = useState('')
    const [resultado, setResultado] = useState<Paciente | null | 'não encontrado'>()
    const [sintomasMarcados, setSintomasMarcados] = useState<string[]>([])
    const [queixaPrincipal, setQueixaPrincipal] = useState('')
    const [diagnostico, setDiagnostico] = useState('')
    const [prescricao, setPrescricao] = useState('')
    const [observacoes, setObservacoes] = useState('')
    const [dataConsulta, setDataConsulta] = useState(new Date().toISOString().split('T')[0])
    const [prontuarioSalvo, setProntuarioSalvo] = useState(false)

    const buscarPaciente = () => {
        const paciente = pacientesMock.find((p) => p.cpf === cpf)
        setResultado(paciente ?? 'não encontrado')
        if (paciente) setEtapa('perfil')
    }

    const toggleSintoma = (name: string) => {
        setSintomasMarcados(prev =>
            prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
        )
    }

    const salvarProntuario = () => {
        setProntuarioSalvo(true)
    }

    const resetFormulario = () => {
        setProntuarioSalvo(false)
        setSintomasMarcados([])
        setQueixaPrincipal('')
        setDiagnostico('')
        setPrescricao('')
        setObservacoes('')
        setDataConsulta(new Date().toISOString().split('T')[0])
    }

    const voltarParaBusca = () => {
        setEtapa('busca')
        setResultado(undefined)
        setCpf('')
        resetFormulario()
    }

    const iniciarNovoProntuario = () => {
        resetFormulario()
        setEtapa('novo-prontuario')
    }

    const modalClass = [
        'modal',
        etapa === 'perfil' ? 'modal-largo' : '',
        etapa === 'novo-prontuario' ? 'modal-medio' : '',
    ].join(' ').trim()

    const sintomassParaPdf = sintomasMarcados.map(
        s => sintomasList.find(sl => sl.name === s)?.label ?? s
    )

    const obsParaPdf = [
        queixaPrincipal && `Queixa principal: ${queixaPrincipal}`,
        diagnostico && `Diagnóstico: ${diagnostico}`,
        prescricao && `Prescrição: ${prescricao}`,
        observacoes,
    ].filter(Boolean).join('\n\n')

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
                            <button className='botao-buscar' onClick={buscarPaciente}>Buscar</button>
                        </div>

                        {resultado === 'não encontrado' && (
                            <div className='resultado-nao-encontrado'>
                                <p>Nenhum paciente encontrado com esse CPF.</p>
                                <button className='botao-cadastrar-novo'>+ Cadastrar novo paciente</button>
                            </div>
                        )}
                    </>
                )}

                {/* ── ETAPA: PERFIL ─────────────────────────────────── */}
                {etapa === 'perfil' && resultado && resultado !== 'não encontrado' && (
                    <>
                        <div className='modal-header'>
                            <div className='modal-header-nav'>
                                <button className='botao-voltar' onClick={voltarParaBusca}>← Voltar</button>
                                <h2>Ficha do Paciente</h2>
                            </div>
                            <button className='botao-fechar' onClick={onFechar}>✕</button>
                        </div>

                        <div className='perfil-paciente'>
                            <div className='perfil-avatar'>{resultado.nome.charAt(0)}</div>
                            <div className='perfil-info'>
                                <h3 className='perfil-nome'>{resultado.nome}</h3>
                                <div className='perfil-detalhes'>
                                    <span>CPF: {resultado.cpf}</span>
                                    <span className='perfil-sep'>·</span>
                                    <span>{resultado.idade} anos</span>
                                    <span className='perfil-sep'>·</span>
                                    <span>{resultado.genero}</span>
                                    <span className='perfil-sep'>·</span>
                                    <span>Nasc.: {resultado.dataNascimento}</span>
                                </div>
                                <span className='perfil-ultima-consulta'>
                                    Última consulta: {resultado.ultimaConsulta}
                                </span>
                            </div>
                        </div>

                        <div className='historico-header'>
                            <h3>Histórico de Consultas</h3>
                            <button className='botao-novo-prontuario' onClick={iniciarNovoProntuario}>
                                + Iniciar Novo Prontuário
                            </button>
                        </div>

                        <div className='historico-lista'>
                            {resultado.historico.map((h, i) => (
                                <div key={i} className='historico-item'>
                                    <div className='historico-item-topo'>
                                        <div className='historico-item-data'>
                                            <span className='historico-data'>{h.data}</span>
                                            <span className='historico-medico'>{h.medico}</span>
                                        </div>
                                        <button
                                            className='botao-gerar-pdf'
                                            onClick={() => gerarPdfConsulta({
                                                paciente: {
                                                    nome: resultado.nome,
                                                    cpf: resultado.cpf,
                                                    idade: resultado.idade,
                                                    genero: resultado.genero,
                                                    dataNascimento: resultado.dataNascimento,
                                                },
                                                consulta: {
                                                    data: h.data,
                                                    medico: h.medico,
                                                    sintomas: h.sintomas,
                                                    observacoes: h.observacoes,
                                                },
                                            })}
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
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* ── ETAPA: NOVO PRONTUÁRIO ─────────────────────────── */}
                {etapa === 'novo-prontuario' && resultado && resultado !== 'não encontrado' && (
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
                                <p>O prontuário de <strong>{resultado.nome}</strong> foi registrado.</p>
                                <div className='prontuario-salvo-acoes'>
                                    <button
                                        className='botao-gerar-pdf'
                                        onClick={() => gerarPdfConsulta({
                                            paciente: {
                                                nome: resultado.nome,
                                                cpf: resultado.cpf,
                                                idade: resultado.idade,
                                                genero: resultado.genero,
                                                dataNascimento: resultado.dataNascimento,
                                            },
                                            consulta: {
                                                data: dataConsulta.split('-').reverse().join('/'),
                                                medico: resultado.medico,
                                                sintomas: sintomassParaPdf,
                                                observacoes: obsParaPdf,
                                            },
                                        })}
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
                                    <span className='prontuario-paciente-nome'>{resultado.nome}</span>
                                    <span className='prontuario-paciente-info'>
                                        {resultado.cpf} · {resultado.idade} anos · {resultado.genero}
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
                                                    key={s.name}
                                                    className={`sintoma-opcao ${sintomasMarcados.includes(s.name) ? 'sintoma-opcao-marcado' : ''}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className='sintoma-check'
                                                        checked={sintomasMarcados.includes(s.name)}
                                                        onChange={() => toggleSintoma(s.name)}
                                                    />
                                                    {s.label}
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
                                        disabled={!queixaPrincipal.trim()}
                                    >
                                        Salvar Prontuário
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
