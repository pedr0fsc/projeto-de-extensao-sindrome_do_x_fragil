import { useState } from 'react'
import './modal-prontuario-estilos.css'
import type { Paciente, Prontuario } from '../../utils/tipos'
import { gerarPdfConsulta } from '../../utils/gerarPDF'

interface Props {
    paciente: Paciente
    onFechar: () => void
    onSalvo?: (prontuario: Prontuario) => void
}

export function ModalNovoProntuario({ paciente, onFechar, onSalvo }: Props) {
    const [queixaPrincipal, setQueixaPrincipal] = useState('')
    const [diagnostico, setDiagnostico] = useState('')
    const [prescricao, setPrescricao] = useState('')
    const [observacoes, setObservacoes] = useState('')
    const [salvo, setSalvo] = useState(false)

    const dataHoje = new Date().toLocaleDateString('pt-BR')

    function handleSalvar() {
        const prontuario: Prontuario = {
            pacienteCpf: paciente.cpf,
            data: dataHoje,
            queixaPrincipal,
            diagnostico,
            prescricao,
            observacoes,
            medico: paciente.medico,
        }
        onSalvo?.(prontuario)
        setSalvo(true)
    }

    function handleGerarPdf() {
        const sintomasRegistrados = queixaPrincipal
            ? [`Queixa: ${queixaPrincipal}`, ...paciente.sintomas]
            : paciente.sintomas

        gerarPdfConsulta({
            paciente: {
                nome: paciente.nome,
                cpf: paciente.cpf,
                idade: paciente.idade,
                genero: paciente.genero,
                dataNascimento: paciente.dataNascimento,
            },
            consulta: {
                data: dataHoje,
                medico: paciente.medico,
                sintomas: sintomasRegistrados,
                observacoes: [diagnostico, prescricao, observacoes].filter(Boolean).join('\n\n'),
            },
        })
    }

    return (
        <div className='prontuario-overlay' onClick={onFechar}>
            <div className='prontuario-modal' onClick={(e) => e.stopPropagation()}>

                <div className='prontuario-header'>
                    <div>
                        <h2>Novo Prontuário</h2>
                        <span className='prontuario-subtitulo'>{paciente.nome} — {paciente.cpf}</span>
                    </div>
                    <button className='prontuario-btn-fechar' onClick={onFechar}>✕</button>
                </div>

                {!salvo ? (
                    <>
                        <div className='prontuario-corpo'>
                            <div className='prontuario-campo'>
                                <label className='prontuario-label'>Queixa principal</label>
                                <input
                                    className='prontuario-input'
                                    type="text"
                                    placeholder="Descreva a queixa principal do paciente"
                                    value={queixaPrincipal}
                                    onChange={(e) => setQueixaPrincipal(e.target.value)}
                                />
                            </div>

                            <div className='prontuario-campo'>
                                <label className='prontuario-label'>Diagnóstico</label>
                                <textarea
                                    className='prontuario-textarea'
                                    rows={4}
                                    placeholder="CID, conclusões clínicas, hipóteses diagnósticas..."
                                    value={diagnostico}
                                    onChange={(e) => setDiagnostico(e.target.value)}
                                />
                            </div>

                            <div className='prontuario-campo'>
                                <label className='prontuario-label'>Prescrição</label>
                                <textarea
                                    className='prontuario-textarea'
                                    rows={4}
                                    placeholder="Medicamentos, dosagens, orientações terapêuticas..."
                                    value={prescricao}
                                    onChange={(e) => setPrescricao(e.target.value)}
                                />
                            </div>

                            <div className='prontuario-campo'>
                                <label className='prontuario-label'>
                                    Observações gerais
                                    <span className='prontuario-label-hint'>campo livre</span>
                                </label>
                                <textarea
                                    className='prontuario-textarea prontuario-textarea-grande'
                                    rows={6}
                                    placeholder="Anotações adicionais, evolução do paciente, intercorrências, encaminhamentos..."
                                    value={observacoes}
                                    onChange={(e) => setObservacoes(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className='prontuario-rodape'>
                            <button className='prontuario-btn-cancelar' onClick={onFechar}>
                                Cancelar
                            </button>
                            <button
                                className='prontuario-btn-salvar'
                                onClick={handleSalvar}
                                disabled={!queixaPrincipal.trim()}
                            >
                                Salvar Prontuário
                            </button>
                        </div>
                    </>
                ) : (
                    <div className='prontuario-sucesso'>
                        <div className='prontuario-sucesso-icone'>✓</div>
                        <h3>Prontuário salvo com sucesso!</h3>
                        <p>Data: {dataHoje} — Médico: {paciente.medico}</p>
                        <div className='prontuario-sucesso-acoes'>
                            <button className='prontuario-btn-pdf' onClick={handleGerarPdf}>
                                Gerar PDF para o paciente
                            </button>
                            <button className='prontuario-btn-cancelar' onClick={onFechar}>
                                Fechar
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}
