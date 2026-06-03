import './pagina-medicos.css'
import { ModalCadastrarPaciente } from '../../componentes/modal-pacientes'
import { ModalConsultarPacientes } from '../../componentes/modal-consultar-pacientes'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import dashboardImg from '../../assets/dashboard.png'
import pacienteImg from '../../assets/paciente.png'
import medicoImg from '../../assets/medico.png'
import lupaImg from '../../assets/lupa.png'
import lixeiraImg from '../../assets/lixeira-de-reciclagem.png'
import pincelImg from '../../assets/pincel.png'
import { gerarPdfConsulta } from '../../utils/gerarPDF'

type Visao = 'dashboard' | 'pacientes'

interface Paciente {
    id: number
    nome: string
    cpf: string
    sexo: string
    data_nascimento: string
    telefone: string
    email: string
}

interface ConsultaRecente {
    paciente: string
    sexo: string
    data: string
    score: number
    recomendacao: string
    medico: string
    atingiu_limiar: boolean
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

export function PaginaMedicos() {
    const [visao, setVisao] = useState<Visao>('dashboard')
    const [modalCadastrarAberto, setModalCadastrarAberto] = useState(false)
    const [modalConsultarAberto, setModalConsultarAberto] = useState(false)
    const [pacientes, setPacientes] = useState<Paciente[]>([])
    const [consultasRecentes, setConsultasRecentes] = useState<ConsultaRecente[]>([])
    const [stats, setStats] = useState({
        totalPacientes: 0,
        consultasMes: 0,
        encaminhados: 0,
        novosPacientes: 0
    })
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const [resPacientes, resRelatorios] = await Promise.all([
                    fetch('/api/pacientes'),
                    fetch('/api/relatorios')
                ])

                if (resPacientes.ok) {
                    const data = await resPacientes.json()
                    setPacientes(data)
                }

                if (resRelatorios.ok) {
                    const data = await resRelatorios.json()
                    setConsultasRecentes(data.relatorios || [])
                    setStats({
                        totalPacientes: data.total || 0,
                        consultasMes: data.total || 0, // Simplified for now
                        encaminhados: data.encaminhados || 0,
                        novosPacientes: data.total || 0 // Simplified for now
                    })
                }
            } catch (err) {
                console.error("Erro ao carregar dados:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    function handleGerarPdf(paciente: Paciente, consulta: ConsultaRecente) {
        gerarPdfConsulta({
            paciente: {
                nome: paciente.nome,
                cpf: paciente.cpf,
                idade: calcularIdade(paciente.data_nascimento),
                genero: paciente.sexo,
                dataNascimento: paciente.data_nascimento.split('-').reverse().join('/'),
            },
            consulta: {
                data: consulta.data,
                medico: consulta.medico,
                sintomas: [], // Backend doesn't return symptoms in /api/relatorios directly
                observacoes: consulta.recomendacao,
            },
        })
    }

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Carregando...</div>

    return (
        <div className='medico-layout'>
            <aside className='medico-sidebar'>
                <div className='sidebar-logo'>
                    <h3>SXF Triagem</h3>
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
                                    <span className='dashboard-card-valor'>{pacientes.length}</span>
                                    <span className='dashboard-card-sub'>Cadastrados por você</span>
                                </div>
                                <div className='dashboard-card'>
                                    <span className='dashboard-card-titulo'>Total de Triagens</span>
                                    <span className='dashboard-card-valor'>{stats.totalPacientes}</span>
                                    <span className='dashboard-card-sub'>Realizadas no sistema</span>
                                </div>
                                <div className='dashboard-card'>
                                    <span className='dashboard-card-titulo'>Encaminhados</span>
                                    <span className='dashboard-card-valor'>{stats.encaminhados}</span>
                                    <span className='dashboard-card-sub'>Atingiram o limiar</span>
                                </div>
                                <div className='dashboard-card'>
                                    <span className='dashboard-card-titulo'>Novos Pacientes</span>
                                    <span className='dashboard-card-valor'>{pacientes.length}</span>
                                    <span className='dashboard-card-sub'>Total acumulado</span>
                                </div>
                            </div>

                            <div className='medico-tabela-container'>
                                <h3 className='dashboard-secao-titulo'>Triagens Recentes</h3>
                                <table className='medico-tabela'>
                                    <thead>
                                        <tr>
                                            <th>Paciente</th>
                                            <th>Data</th>
                                            <th>Score</th>
                                            <th>Status</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {consultasRecentes.map((c, i) => (
                                            <tr key={i}>
                                                <td>{c.paciente}</td>
                                                <td>{c.data}</td>
                                                <td>{c.score.toFixed(3)}</td>
                                                <td>
                                                    <span className={`status-badge ${c.atingiu_limiar ? 'status-pendente' : 'status-concluida'}`}>
                                                        {c.atingiu_limiar ? 'Encaminhar' : 'Observação'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {/* In a real app, we'd fetch the specific triage for symptoms/obs */}
                                                    <button
                                                        className='btn-pdf'
                                                        onClick={() => {
                                                            const p = pacientes.find(p => p.nome === c.paciente)
                                                            if (p) handleGerarPdf(p, c)
                                                            else alert('Dados do paciente não encontrados para gerar PDF')
                                                        }}
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
                                            <th>CPF</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pacientes.map((p, i) => (
                                            <tr key={i}>
                                                <td>{p.nome}</td>
                                                <td>{calcularIdade(p.data_nascimento)} anos</td>
                                                <td>{p.sexo}</td>
                                                <td>{p.data_nascimento.split('-').reverse().join('/')}</td>
                                                <td>{p.cpf}</td>
                                                <td>
                                                    <div className='acoes-celula'>
                                                        <button className='btn-tabela'><img src={lixeiraImg} alt="Excluir" /></button>
                                                        <button className='btn-tabela'><img src={pincelImg} alt="Editar" /></button>
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
                <ModalCadastrarPaciente onFechar={() => {
                    setModalCadastrarAberto(false)
                    window.location.reload() // Simple way to refresh data
                }} />
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
