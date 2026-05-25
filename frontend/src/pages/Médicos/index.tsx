import './pagina-medicos.css'
import { ModalCadastrarPaciente } from '../../componentes/Modal-pacientes'
import { ModalConsultarPacientes } from '../../componentes/modal-consultar-pacientes'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dashboardImg from '../../assets/dashboard.png'
import pacienteImg from '../../assets/paciente.png'
import medicoImg from '../../assets/medico.png'
import lupaImg from '../../assets/lupa.png'
import lixeiraImg from '../../assets/lixeira-de-reciclagem.png'
import pincelImg from '../../assets/pincel.png'
import { gerarPdfConsulta } from '../../utils/gerarPDF'

type Visao = 'dashboard' | 'pacientes'

const consultasRecentes = [
    {
        nome: 'João Silva',
        data: '20/05/2026',
        sintomas: ['Deficiência intelectual', 'Atraso na fala', 'Hiperatividade'],
        observacoes: 'Paciente apresentou melhora no comportamento após intervenção terapêutica.',
        status: 'Concluída',
    },
    {
        nome: 'Ana Costa',
        data: '18/05/2026',
        sintomas: ['Hipermobilidade articular', 'Dificuldades de aprendizagem', 'Déficit de atenção', 'Mov. repetitivo', 'Evita contato visual'],
        observacoes: 'Iniciado acompanhamento fonoaudiológico semanal.',
        status: 'Concluída',
    },
    {
        nome: 'Pedro Lima',
        data: '15/05/2026',
        sintomas: ['Agressividade', 'Evita contato físico'],
        observacoes: 'Encaminhado para avaliação neuropsicológica.',
        status: 'Concluída',
    },
    {
        nome: 'Maria Santos',
        data: '10/05/2026',
        sintomas: ['Deficiência intelectual', 'Face alongada/orelha', 'Macroorquidismo', 'Atraso na fala', 'Hiperatividade', 'Déficit de atenção', 'Evita contato visual'],
        observacoes: 'Paciente com quadro clínico característico. Exame genético solicitado.',
        status: 'Concluída',
    },
]

const pacientesMock = [
    { nome: 'João Silva', idade: '10 anos', genero: 'Masculino', nascimento: '01/01/2016', ultimaConsulta: '20/05/2026', cpf: '000.000.000-00' },
    { nome: 'Ana Costa', idade: '8 anos', genero: 'Feminino', nascimento: '15/03/2018', ultimaConsulta: '18/05/2026', cpf: '111.111.111-11' },
    { nome: 'Pedro Lima', idade: '12 anos', genero: 'Masculino', nascimento: '22/07/2014', ultimaConsulta: '15/05/2026', cpf: '222.222.222-22' },
]

export function PaginaMedicos() {
    const [visao, setVisao] = useState<Visao>('dashboard')
    const [modalCadastrarAberto, setModalCadastrarAberto] = useState(false)
    const [modalConsultarAberto, setModalConsultarAberto] = useState(false)
    const navigate = useNavigate()

    function handleGerarPdf(paciente: typeof pacientesMock[0], consulta: typeof consultasRecentes[0]) {
        gerarPdfConsulta({
            paciente: {
                nome: paciente.nome,
                cpf: paciente.cpf,
                idade: parseInt(paciente.idade),
                genero: paciente.genero,
                dataNascimento: paciente.nascimento,
            },
            consulta: {
                data: paciente.ultimaConsulta,
                medico: 'Dr. Médico Responsável',
                sintomas: consulta.sintomas,
                observacoes: consulta.observacoes,
            },
        })
    }

    return (
        <div className='medico-layout'>
            <aside className='medico-sidebar'>
                <div className='sidebar-logo'>
                    <h3>Logo do projeto</h3>
                </div>
                <nav className='sidebar-nav'>
                    <button
                        className={`sidebar-item ${visao === 'dashboard' ? 'sidebar-item-ativo' : ''}`}
                        onClick={() => setVisao('dashboard')}
                    >
                        <img src={dashboardImg} alt="" />
                        Dashboard
                    </button>
                    <button
                        className={`sidebar-item ${visao === 'pacientes' ? 'sidebar-item-ativo' : ''}`}
                        onClick={() => setVisao('pacientes')}
                    >
                        <img src={pacienteImg} alt="" />
                        Pacientes
                    </button>
                </nav>
            </aside>

            <div className='medico-main'>
                <header className='medico-topbar'>
                    <div className='medico-search'>
                        <img src={lupaImg} alt="" />
                        <input type="text" placeholder="Pesquisar" />
                    </div>
                    <button className='medico-perfil'>
                        <img src={medicoImg} alt="" />
                        Médico
                    </button>
                </header>

                <div className='medico-conteudo'>
                    {visao === 'dashboard' && (
                        <>
                            <h2 className='dashboard-titulo'>Dashboard</h2>

                            <div className='dashboard-cards'>
                                <div className='dashboard-card'>
                                    <span className='dashboard-card-titulo'>Total de Pacientes</span>
                                    <span className='dashboard-card-valor'>24</span>
                                    <span className='dashboard-card-sub'>+2 este mês</span>
                                </div>
                                <div className='dashboard-card'>
                                    <span className='dashboard-card-titulo'>Consultas este Mês</span>
                                    <span className='dashboard-card-valor'>12</span>
                                    <span className='dashboard-card-sub'>↑ 3 a mais que o mês anterior</span>
                                </div>
                                <div className='dashboard-card'>
                                    <span className='dashboard-card-titulo'>Avaliações Pendentes</span>
                                    <span className='dashboard-card-valor'>3</span>
                                    <span className='dashboard-card-sub'>Aguardando análise</span>
                                </div>
                                <div className='dashboard-card'>
                                    <span className='dashboard-card-titulo'>Novos Pacientes</span>
                                    <span className='dashboard-card-valor'>5</span>
                                    <span className='dashboard-card-sub'>Nos últimos 30 dias</span>
                                </div>
                            </div>

                            <div className='medico-tabela-container'>
                                <h3 className='dashboard-secao-titulo'>Consultas Recentes</h3>
                                <table className='medico-tabela'>
                                    <thead>
                                        <tr>
                                            <th>Paciente</th>
                                            <th>Data</th>
                                            <th>Sintomas Registrados</th>
                                            <th>Status</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {consultasRecentes.map((c, i) => (
                                            <tr key={i}>
                                                <td>{c.nome}</td>
                                                <td>{c.data}</td>
                                                <td>{c.sintomas.length} sintoma(s)</td>
                                                <td>
                                                    <span className='status-badge status-concluida'>{c.status}</span>
                                                </td>
                                                <td>
                                                    <button
                                                        className='btn-pdf'
                                                        onClick={() => gerarPdfConsulta({
                                                            paciente: { nome: c.nome, cpf: '000.000.000-00', idade: 10, genero: 'Masculino', dataNascimento: '01/01/2016' },
                                                            consulta: { data: c.data, medico: 'Dr. Médico Responsável', sintomas: c.sintomas, observacoes: c.observacoes },
                                                        })}
                                                    >
                                                        Gerar PDF
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {visao === 'pacientes' && (
                        <>
                            <div className='medico-filtros-header'>
                                <h2>Filtros:</h2>
                                <div className='medico-acoes-header'>
                                    <button onClick={() => setModalConsultarAberto(true)} className='btn-acao-header'>
                                        + Consultar Paciente
                                    </button>
                                    <button onClick={() => setModalCadastrarAberto(true)} className='btn-acao-header btn-acao-primario'>
                                        + Inserir Paciente
                                    </button>
                                </div>
                            </div>

                            <div className='medico-filtros'>
                                <button className='filtro-chip'>Nome</button>
                                <button className='filtro-chip'>Idade</button>
                                <button className='filtro-chip'>Sexo</button>
                                <button className='filtro-chip'>Data de nascimento</button>
                                <button className='filtro-chip'>Última consulta</button>
                            </div>

                            <div className='medico-tabela-container'>
                                <h3>Lista de pacientes:</h3>
                                <table className='medico-tabela'>
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>Idade</th>
                                            <th>Gênero</th>
                                            <th>Nascimento</th>
                                            <th>Última consulta</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pacientesMock.map((p, i) => (
                                            <tr key={i}>
                                                <td>{p.nome}</td>
                                                <td>{p.idade}</td>
                                                <td>{p.genero}</td>
                                                <td>{p.nascimento}</td>
                                                <td>{p.ultimaConsulta}</td>
                                                <td>
                                                    <div className='acoes-celula'>
                                                        <button className='btn-tabela'><img src={lixeiraImg} alt="Excluir" /></button>
                                                        <button className='btn-tabela'><img src={pincelImg} alt="Editar" /></button>
                                                        <button
                                                            className='btn-pdf'
                                                            onClick={() => handleGerarPdf(p, consultasRecentes[i] ?? consultasRecentes[0])}
                                                        >
                                                            Gerar PDF
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {modalCadastrarAberto && (
                <ModalCadastrarPaciente onFechar={() => setModalCadastrarAberto(false)} />
            )}
            {modalConsultarAberto && (
                <ModalConsultarPacientes onFechar={() => setModalConsultarAberto(false)} />
            )}

            {import.meta.env.DEV && (
                <button
                    onClick={() => navigate('/pagina-administrador')}
                    style={{ position: 'fixed', bottom: 16, right: 16, background: '#ff6b6b', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', opacity: 0.8 }}
                >
                    [DEV] Ir para Admin
                </button>
            )}
        </div>
    )
}
export default PaginaMedicos
