import './administrador-estilos.css'
import { useState, useEffect } from 'react'
import { ModalCadastrarMedico } from '../../componentes/modal-cadastrar-medico'
import dashboardImg from '../../assets/dashboard.png'
import medicoImg from '../../assets/medico.png'
import pacienteImg from '../../assets/paciente.png'
import administradorImg from '../../assets/administrador.png'
import lupaImg from '../../assets/lupa.png'
import lixeiraImg from '../../assets/lixeira-de-reciclagem.png'
import pincelImg from '../../assets/pincel.png'

type Visao = 'dashboard' | 'medicos' | 'pacientes'

interface Medico {
    id: number
    nome: string
    crm: string
}

interface Paciente {
    id: number
    nome: string
    cpf: string
    sexo: string
    data_nascimento: string
    telefone: string
    email: string
}

interface Relatorio {
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

export function PaginaAdministrador() {
    const [modalCadastrarAberto, setModalCadastrarAberto] = useState(false)
    const [visao, setVisao] = useState<Visao>('dashboard')
    const [medicos, setMedicos] = useState<Medico[]>([])
    const [pacientes, setPacientes] = useState<Paciente[]>([])
    const [relatorios, setRelatorios] = useState<Relatorio[]>([])
    const [stats, setStats] = useState({
        totalMedicos: 0,
        totalPacientes: 0,
        totalTriagens: 0,
        encaminhados: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const [resMedicos, resPacientes, resRelatorios] = await Promise.all([
                    fetch('/api/medicos'),
                    fetch('/api/pacientes'),
                    fetch('/api/relatorios')
                ])

                const dataMedicos = await resMedicos.json()
                const dataPacientes = await resPacientes.json()
                const dataRelatorios = await resRelatorios.json()

                setMedicos(dataMedicos || [])
                setPacientes(dataPacientes || [])
                setRelatorios(dataRelatorios.relatorios || [])
                setStats({
                    totalMedicos: dataMedicos.length || 0,
                    totalPacientes: dataPacientes.length || 0,
                    totalTriagens: dataRelatorios.total || 0,
                    encaminhados: dataRelatorios.encaminhados || 0
                })
            } catch (err) {
                console.error("Erro ao carregar dados admin:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    // Agrupar atividades por médico
    const atividadesMedicos = medicos.map(m => {
        const triagensMedico = relatorios.filter(r => r.medico === m.nome)
        return {
            medico: m.nome,
            crm: m.crm,
            consultas: triagensMedico.length,
            pacientes: new Set(triagensMedico.map(r => r.paciente)).size
        }
    })

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Carregando Painel Admin...</div>

    return (
        <div className='admin-layout'>
            <aside className='admin-sidebar'>
                <div className='sidebar-logo'>
                    <h3>SXF Admin</h3>
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
                        className={`sidebar-item ${visao === 'medicos' ? 'sidebar-item-ativo' : ''}`}
                        onClick={() => setVisao('medicos')}
                    >
                        <img src={medicoImg} alt="" />
                        Médicos
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

            <div className='admin-main'>
                <header className='admin-topbar'>
                    <div className='admin-search'>
                        <img src={lupaImg} alt="" />
                        <input type="text" placeholder="Pesquisar" />
                    </div>
                    <button className='admin-perfil'>
                        <img src={administradorImg} alt="" />
                        Administrador
                    </button>
                </header>

                <div className='admin-conteudo'>
                    {visao === 'dashboard' && (
                        <>
                            <h2 className='dashboard-titulo'>Dashboard do Administrador</h2>

                            <div className='dashboard-cards'>
                                <div className='dashboard-card dashboard-card-destaque'>
                                    <span className='dashboard-card-titulo'>Total de Médicos</span>
                                    <span className='dashboard-card-valor'>{stats.totalMedicos}</span>
                                    <span className='dashboard-card-sub'>Ativos no sistema</span>
                                </div>
                                <div className='dashboard-card dashboard-card-destaque'>
                                    <span className='dashboard-card-titulo'>Total de Pacientes</span>
                                    <span className='dashboard-card-valor'>{stats.totalPacientes}</span>
                                    <span className='dashboard-card-sub'>Cadastrados</span>
                                </div>
                                <div className='dashboard-card dashboard-card-destaque'>
                                    <span className='dashboard-card-titulo'>Total de Triagens</span>
                                    <span className='dashboard-card-valor'>{stats.totalTriagens}</span>
                                    <span className='dashboard-card-sub'>Realizadas no total</span>
                                </div>
                                <div className='dashboard-card dashboard-card-destaque'>
                                    <span className='dashboard-card-titulo'>Encaminhados</span>
                                    <span className='dashboard-card-valor'>{stats.encaminhados}</span>
                                    <span className='dashboard-card-sub'>Para teste genético</span>
                                </div>
                            </div>

                            <div className='admin-tabela-container'>
                                <h3 className='dashboard-secao-titulo'>Atividade por Médico</h3>
                                <table className='admin-tabela'>
                                    <thead>
                                        <tr>
                                            <th>Médico</th>
                                            <th>CRM</th>
                                            <th>Triagens Realizadas</th>
                                            <th>Pacientes Atendidos</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {atividadesMedicos.map((a, i) => (
                                            <tr key={i}>
                                                <td>{a.medico}</td>
                                                <td>{a.crm}</td>
                                                <td>{a.consultas}</td>
                                                <td>{a.pacientes}</td>
                                                <td>
                                                    <span className='status-badge status-ativo'>Ativo</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className='admin-tabela-container'>
                                <h3 className='dashboard-secao-titulo'>Últimas Triagens Realizadas</h3>
                                <table className='admin-tabela'>
                                    <thead>
                                        <tr>
                                            <th>Paciente</th>
                                            <th>Sexo</th>
                                            <th>Médico</th>
                                            <th>Data</th>
                                            <th>Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {relatorios.slice(0, 5).map((r, i) => (
                                            <tr key={i}>
                                                <td>{r.paciente}</td>
                                                <td>{r.sexo}</td>
                                                <td>{r.medico}</td>
                                                <td>{r.data}</td>
                                                <td>{r.score.toFixed(3)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {visao === 'medicos' && (
                        <div className='admin-secao'>
                            <div className='admin-filtros-header'>
                                <h2>Filtros:</h2>
                                <button onClick={() => setModalCadastrarAberto(true)} className='btn-inserir'>
                                    + Inserir médico
                                </button>
                            </div>
                            <div className='admin-filtros'>
                                <button className='filtro-chip'>Nome</button>
                                <button className='filtro-chip'>CRM</button>
                            </div>
                            <div className='admin-tabela-container'>
                                <h3>Lista de médicos:</h3>
                                <table className='admin-tabela'>
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>CRM</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {medicos.map((m, i) => (
                                            <tr key={i}>
                                                <td>{m.nome}</td>
                                                <td>{m.crm}</td>
                                                <td>
                                                    <div className='acoes-celula'>
                                                        <button className='btn-acao'><img src={lixeiraImg} alt="Excluir" /></button>
                                                        <button className='btn-acao'><img src={pincelImg} alt="Editar" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {visao === 'pacientes' && (
                        <div className='admin-secao'>
                            <div className='admin-filtros-header'>
                                <h2>Filtros:</h2>
                            </div>
                            <div className='admin-filtros'>
                                <button className='filtro-chip'>Nome</button>
                                <button className='filtro-chip'>Idade</button>
                                <button className='filtro-chip'>Sexo</button>
                            </div>
                            <div className='admin-tabela-container'>
                                <h3>Lista de pacientes:</h3>
                                <table className='admin-tabela'>
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
                                                        <button className='btn-acao'><img src={lixeiraImg} alt="Excluir" /></button>
                                                        <button className='btn-acao'><img src={pincelImg} alt="Editar" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {modalCadastrarAberto && (
                <ModalCadastrarMedico onFechar={() => {
                    setModalCadastrarAberto(false)
                    window.location.reload()
                }} />
            )}
        </div>
    )
}
export default PaginaAdministrador
