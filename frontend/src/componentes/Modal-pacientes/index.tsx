import { useState } from 'react'
import './modal-pacientes-estilos.css'

interface Props {
    onFechar: () => void
}

const TOTAL_STEPS = 3

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

const acompanhanteOpcoes = [
    { value: 'mae', label: 'Mãe' },
    { value: 'pai', label: 'Pai' },
    { value: 'outro', label: 'Outro' },
]

const stepsTitulos = ['Dados Básicos', 'Acompanhante', 'Sintomas']

export function ModalCadastrarPaciente({ onFechar }: Props) {
    const [step, setStep] = useState(1)
    const [genero, setGenero] = useState('')
    const [sintomasMarcados, setSintomasMarcados] = useState<string[]>([])

    const toggleSintoma = (name: string) => {
        setSintomasMarcados(prev =>
            prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
        )
    }

    return (
        <div className='overlay' onClick={onFechar}>
            <div className='modal-ms' onClick={(e) => e.stopPropagation()}>

                {/* Topo */}
                <div className='ms-topo'>
                    <h2>Adicionar Paciente</h2>
                    <button className='ms-btn-fechar' onClick={onFechar}>✕</button>
                </div>

                {/* Indicador de steps */}
                <div className='ms-steps'>
                    {stepsTitulos.flatMap((titulo, i) => {
                        const num = i + 1
                        const ativo = num === step
                        const concluido = num < step
                        const items = [
                            <div key={`step-${num}`} className='ms-step-item'>
                                <div className={`ms-circulo ${ativo ? 'ms-ativo' : ''} ${concluido ? 'ms-concluido' : ''}`}>
                                    {num}
                                </div>
                                <span className={`ms-step-nome ${ativo || concluido ? 'ms-step-nome-ativo' : ''}`}>
                                    {titulo}
                                </span>
                            </div>
                        ]
                        if (i < stepsTitulos.length - 1) {
                            items.push(
                                <div key={`line-${i}`} className={`ms-conector ${concluido ? 'ms-conector-ativo' : ''}`} />
                            )
                        }
                        return items
                    })}
                </div>

                {/* Conteúdo */}
                <div className='ms-corpo'>

                    {step === 1 && (
                        <div className='ms-secao'>
                            <h3 className='ms-secao-titulo'>Dados Básicos</h3>
                            <div className='ms-campo-full'>
                                <label className='ms-label'>Nome completo</label>
                                <input className='ms-input' type="text" placeholder="Digite o nome completo" />
                            </div>
                            <div className='ms-linha-dupla'>
                                <div className='ms-campo'>
                                    <label className='ms-label'>Data de nascimento</label>
                                    <input className='ms-input' type="date" />
                                </div>
                                <div className='ms-campo'>
                                    <label className='ms-label'>Idade</label>
                                    <input className='ms-input' type="number" placeholder="Ex: 10" />
                                </div>
                            </div>
                            <div className='ms-campo-full'>
                                <label className='ms-label'>Gênero</label>
                                <div className='ms-radio-grupo'>
                                    {['Masculino', 'Feminino', 'Outro'].map(g => (
                                        <button
                                            key={g}
                                            type="button"
                                            className={`ms-radio-opcao ${genero === g ? 'ms-radio-selecionado' : ''}`}
                                            onClick={() => setGenero(g)}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className='ms-campo-full'>
                                <label className='ms-label'>E-mail</label>
                                <input className='ms-input' type="email" placeholder="Digite o e-mail" />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className='ms-secao'>
                            <h3 className='ms-secao-titulo'>Dados do Acompanhante</h3>
                            <div className='ms-campo-full'>
                                <label className='ms-label'>Tipo de acompanhante</label>
                                <select className='ms-select'>
                                    <option value="">Selecione</option>
                                    {acompanhanteOpcoes.map(a => (
                                        <option key={a.value} value={a.value}>{a.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className='ms-campo-full'>
                                <label className='ms-label'>Nome do acompanhante</label>
                                <input className='ms-input' type="text" placeholder="Digite o nome do acompanhante" />
                            </div>
                            <div className='ms-campo-full'>
                                <label className='ms-label'>Observações</label>
                                <textarea className='ms-textarea' placeholder="Observações adicionais sobre o paciente..." />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className='ms-secao'>
                            <h3 className='ms-secao-titulo'>Sintomas observados</h3>
                            <p className='ms-secao-subtitulo'>Selecione todos os sintomas que o paciente apresenta</p>
                            <div className='ms-sintomas-grid'>
                                {sintomasList.map(s => (
                                    <label
                                        key={s.name}
                                        className={`ms-sintoma-card ${sintomasMarcados.includes(s.name) ? 'ms-sintoma-marcado' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            className='ms-sintoma-check'
                                            checked={sintomasMarcados.includes(s.name)}
                                            onChange={() => toggleSintoma(s.name)}
                                        />
                                        {s.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* Rodapé */}
                <div className='ms-rodape'>
                    {step > 1 ? (
                        <button className='ms-btn-secundario' onClick={() => setStep(s => s - 1)}>
                            Anterior
                        </button>
                    ) : (
                        <button className='ms-btn-secundario' onClick={onFechar}>
                            Cancelar
                        </button>
                    )}
                    {step < TOTAL_STEPS ? (
                        <button className='ms-btn-primario' onClick={() => setStep(s => s + 1)}>
                            Salvar e Continuar
                        </button>
                    ) : (
                        <button className='ms-btn-primario'>
                            Concluir
                        </button>
                    )}
                </div>

            </div>
        </div>
    )
}

