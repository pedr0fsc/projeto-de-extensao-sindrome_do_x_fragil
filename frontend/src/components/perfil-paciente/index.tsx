import { useState } from 'react'
import './perfil-paciente-estilos.css'
import type { Paciente, ConsultaHistorico } from '../../utils/tipos'
import { ModalNovoProntuario } from '../modal-prontuario'
import { gerarPdfConsulta } from '../../utils/gerarPDF'

interface Props {
    paciente: Paciente
    onFechar: () => void
}

const historicoPorPaciente: ConsultaHistorico[] = [
    { id: 1, data: '20/05/2026', medico: 'Dr. Médico Responsável', motivo: 'Avaliação de desenvolvimento cognitivo' },
    { id: 2, data: '15/02/2026', medico: 'Dr. Médico Responsável', motivo: 'Reavaliação comportamental após terapia' },
    { id: 3, data: '10/10/2025', medico: 'Dra. Ana Lima', motivo: 'Consulta de rotina — acompanhamento semestral' },
    { id: 4, data: '05/05/2025', medico: 'Dra. Ana Lima', motivo: 'Triagem inicial — primeira consulta' },
]

export function PerfilPaciente({ paciente, onFechar }: Props) {
    const [prontuarioAberto, setProntuarioAberto] = useState(false)

    function handleGerarPdfConsulta(consulta: ConsultaHistorico) {
        gerarPdfConsulta({
            paciente: {
                nome: paciente.nome,
                cpf: paciente.cpf,
                idade: paciente.idade,
                genero: paciente.genero,
                dataNascimento: paciente.dataNascimento,
            },
            consulta: {
                data: consulta.data,
                medico: consulta.medico,
                sintomas: paciente.sintomas,
                observacoes: paciente.observacoes,
            },
        })
    }

    return (
        <>
            <div className='perfil-overlay' onClick={onFechar}>
                <div className='perfil-modal' onClick={(e) => e.stopPropagation()}>

                    <div className='perfil-header'>
                        <div className='perfil-avatar'>
                            {paciente.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className='perfil-header-info'>
                            <h2>{paciente.nome}</h2>
                            <span className='perfil-cpf'>CPF: {paciente.cpf}</span>
                        </div>
                        <button className='perfil-btn-fechar' onClick={onFechar}>✕</button>
                    </div>

                    <div className='perfil-dados'>
                        <div className='perfil-dado-item'>
                            <span className='perfil-dado-label'>Idade</span>
                            <span className='perfil-dado-valor'>{paciente.idade} anos</span>
                        </div>
                        <div className='perfil-dado-item'>
                            <span className='perfil-dado-label'>Sexo Biológico</span>
                            <span className='perfil-dado-valor'>{paciente.genero}</span>
                        </div>
                        <div className='perfil-dado-item'>
                            <span className='perfil-dado-label'>Nascimento</span>
                            <span className='perfil-dado-valor'>{paciente.dataNascimento}</span>
                        </div>
                        <div className='perfil-dado-item'>
                            <span className='perfil-dado-label'>Última consulta</span>
                            <span className='perfil-dado-valor'>{paciente.ultimaConsulta}</span>
                        </div>
                    </div>

                    {paciente.sintomas.length > 0 && (
                        <div className='perfil-sintomas'>
                            <span className='perfil-secao-titulo'>Sintomas registrados</span>
                            <div className='perfil-sintomas-lista'>
                                {paciente.sintomas.map((s) => (
                                    <span key={s} className='perfil-sintoma-tag'>{s}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className='perfil-historico'>
                        <div className='perfil-historico-header'>
                            <span className='perfil-secao-titulo'>Histórico de consultas</span>
                            <span className='perfil-historico-total'>{historicoPorPaciente.length} consultas</span>
                        </div>
                        <table className='perfil-tabela'>
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Médico</th>
                                    <th>Motivo</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {historicoPorPaciente.map((c) => (
                                    <tr key={c.id}>
                                        <td className='perfil-td-data'>{c.data}</td>
                                        <td>{c.medico}</td>
                                        <td>{c.motivo}</td>
                                        <td>
                                            <button
                                                className='perfil-btn-pdf'
                                                onClick={() => handleGerarPdfConsulta(c)}
                                                title="Gerar PDF desta consulta"
                                            >
                                                PDF
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className='perfil-rodape'>
                        <button className='perfil-btn-fechar-rodape' onClick={onFechar}>
                            Fechar
                        </button>
                        <button
                            className='perfil-btn-prontuario'
                            onClick={() => setProntuarioAberto(true)}
                        >
                            + Iniciar novo prontuário
                        </button>
                    </div>

                </div>
            </div>

            {prontuarioAberto && (
                <ModalNovoProntuario
                    paciente={paciente}
                    onFechar={() => setProntuarioAberto(false)}
                />
            )}
        </>
    )
}
