import './pagina-medicos.css'
import { ModalCadastrarPaciente } from '../../componentes/modal-pacientes'
import { ModalConsultarPacientes } from '../../componentes/modal-consultar-pacientes'
import { ModalEditarPaciente } from '../../componentes/modal-editar-paciente'
import { ModalFotosPaciente } from '../../componentes/modal-fotos-paciente'
import { useAlerta } from '../../componentes/alerta'
import { useState, useEffect, useMemo } from 'react'
import { useTransitionNavigate } from '../../hooks/useTransitionNavigate'
import dashboardImg from '../../assets/dashboard.png'
import pacienteImg from '../../assets/paciente.png'
import medicoImg from '../../assets/medico.png'
import logoImg from '../../assets/logo.png'
import pincelImg from '../../assets/pincel.png'
import { gerarPdfConsulta } from '../../utils/gerarPDF'
import { formatarCPF } from '../../utils/mascaras'
import { SearchBar } from '../../componentes/search-bar'
import { Footer } from '../../componentes/footer'

type Visao = 'dashboard' | 'pacientes'
type SortField = 'nome' | 'idade' | 'sexo' | 'nascimento'
type SortOrder = 'asc' | 'desc'

interface Paciente {
    id: number
    nome: string
    cpf: string
    sexo: string
    data_nascimento: string
    telefone: string
    email: string
    id_instituto: number | null
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

function calcularIdade(dataNascimento: string): number {
    const hoje = new Date()
    const nascimento = new Date(dataNascimento)
    let idade = hoje.getFullYear() - nascimento.getFullYear()
    const m = hoje.getMonth() - nascimento.getMonth()
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--
    }
    return idade
}

// ─── Sort chip row ────────────────────────────────────────────────────────────
interface SortChipsProps<T extends string> {
    chips: { label: string; value: T }[]
    active: T
    order: SortOrder
    onSort: (field: T) => void
}

function SortChips<T extends string>({ chips, active, order, onSort }: SortChipsProps<T>) {
    return (
        <div className='medico-filtros'>
            {chips.map(chip => (
                <button
                    key={chip.value}
                    className={`filtro-chip ${active === chip.value ? 'filtro-chip-ativo' : ''}`}
                    onClick={() => onSort(chip.value)}
                >
                    {chip.label}
                    {active === chip.value && (
                        <span className='filtro-chip-seta'>{order === 'asc' ? '↑' : '↓'}</span>
                    )}
                </button>
            ))}
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function PaginaMedicos() {
    const [visao, setVisao] = useState<Visao>('dashboard')
    const [modalCadastrarAberto, setModalCadastrarAberto] = useState(false)
    const [modalConsultarAberto, setModalConsultarAberto] = useState(false)
    const [pacienteParaEditar, setPacienteParaEditar] = useState<Paciente | null>(null)
    const [pacienteFotosVisualizar, setPacienteFotosVisualizar] = useState<Paciente | null>(null)
    const [pacientes, setPacientes] = useState<Paciente[]>([])
    const [consultasRecentes, setConsultasRecentes] = useState<ConsultaRecente[]>([])
    const [stats, setStats] = useState({
        totalPacientes: 0,
        consultasMes: 0,
        encaminhados: 0,
        novosPacientes: 0,
    })
    const [userName, setUserName] = useState('')
    const [loading, setLoading] = useState(true)

    // Search term is scoped per view so switching tabs never bleeds state
    const [searchDashboard, setSearchDashboard] = useState('')
    const [searchPacientes, setSearchPacientes] = useState('')

    const [sortField, setSortField] = useState<SortField>('nome')
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
    const navigate = useTransitionNavigate()
    const { mostrarAlerta } = useAlerta()

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortField(field)
            setSortOrder('asc')
        }
    }

    // ── Filtered + sorted lists ──────────────────────────────────────────────
    const filteredConsultas = useMemo(() => {
        const term = searchDashboard.toLowerCase()
        if (!term) return consultasRecentes
        return consultasRecentes.filter(c =>
            c.paciente.toLowerCase().includes(term) ||
            c.sexo.toLowerCase().includes(term) ||
            c.data.includes(term) ||
            c.score.toString().includes(term) ||
            c.medico.toLowerCase().includes(term) ||
            c.recomendacao.toLowerCase().includes(term)
        )
    }, [consultasRecentes, searchDashboard])

    const sortedPacientes = useMemo(() => {
        const term = searchPacientes.toLowerCase()
        const filtered = term
            ? pacientes.filter(p =>
                p.nome.toLowerCase().includes(term) ||
                p.cpf.includes(term) ||
                formatarCPF(p.cpf).includes(term) ||
                p.email.toLowerCase().includes(term) ||
                p.telefone.includes(term) ||
                p.sexo.toLowerCase().includes(term) ||
                calcularIdade(p.data_nascimento).toString().includes(term) ||
                p.data_nascimento.includes(term) ||
                p.data_nascimento.split('-').reverse().join('/').includes(term)
            )
            : [...pacientes]

        return filtered.sort((a, b) => {
            let valA: string | number
            let valB: string | number

            if (sortField === 'idade') {
                valA = calcularIdade(a.data_nascimento)
                valB = calcularIdade(b.data_nascimento)
            } else if (sortField === 'nascimento') {
                valA = a.data_nascimento
                valB = b.data_nascimento
            } else if (sortField === 'sexo') {
                valA = a.sexo
                valB = b.sexo
            } else {
                valA = a.nome
                valB = b.nome
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1
            return 0
        })
    }, [pacientes, searchPacientes, sortField, sortOrder])

    // ── Data fetching ────────────────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true)
        try {
            const [resPacientes, resRelatorios, resCheck] = await Promise.all([
                fetch('/api/pacientes'),
                fetch('/api/relatorios'),
                fetch('/api/check'),
            ])


            if (resCheck.ok) {
                const checkData = await resCheck.json()
                if (!checkData.logged_in) {
                    navigate('/login-medicos')
                    return
                }
                setUserName(checkData.nome)
            } else {
                navigate('/login-medicos')
                return
            }

            if (resPacientes.ok) setPacientes(await resPacientes.json())

            if (resRelatorios.ok) {
                const data = await resRelatorios.json()
                setConsultasRecentes(data.relatorios || [])
                setStats({
                    totalPacientes: data.total || 0,
                    consultasMes: data.total || 0,
                    encaminhados: data.encaminhados || 0,
                    novosPacientes: data.total || 0,
                })
            }
        } catch (err) {
            console.error('Erro ao carregar dados:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

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
                sintomas: [],
                observacoes: consulta.recomendacao,
            },
        })
    }

    if (loading)
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                Carregando...
            </div>
        )

    const pacienteSortChips: { label: string; value: SortField }[] = [
        { label: 'Nome', value: 'nome' },
        { label: 'Idade', value: 'idade' },
        { label: 'Sexo', value: 'sexo' },
        { label: 'Data de Nascimento', value: 'nascimento' },
    ]

    return (
        <div className='medico-layout'>
            {/* ── Sidebar ── */}
            <aside className='medico-sidebar'>
                <div className='sidebar-logo'>
                    <img src={logoImg} alt="SXF Triagem" />
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

            {/* ── Main ── */}
            <div className='medico-main'>
                <header className='medico-topbar'>
                    <SearchBar
                        value={visao === 'dashboard' ? searchDashboard : searchPacientes}
                        onChange={visao === 'dashboard' ? setSearchDashboard : setSearchPacientes}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {userName && (
                            <span style={{ fontWeight: 500, color: '#444' }}>Bem Vindo, {userName}</span>
                        )}
                        <label className='medico-perfil'>
                            <img src={medicoImg} alt="" />
                            Médico
                        </label>
                    </div>
                </header>

                <div className='medico-conteudo'>
                    {/* ── Dashboard view ── */}
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
                                        {filteredConsultas.map((c, i) => (
                                            <tr key={i}>
                                                <td>{c.paciente}</td>
                                                <td>{c.data}</td>
                                                <td>{c.score.toFixed(3)}</td>
                                                <td>
                                                    <span
                                                        className={`status-badge ${c.atingiu_limiar ? 'status-pendente' : 'status-concluida'
                                                            }`}
                                                    >
                                                        {c.atingiu_limiar ? 'Encaminhar' : 'Observação'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className='btn-pdf'
                                                        onClick={() => {
                                                            const p = pacientes.find(p => p.nome === c.paciente)
                                                            if (p) handleGerarPdf(p, c)
                                                            else mostrarAlerta('Dados do paciente não encontrados para gerar PDF', 'erro')
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

                    {/* ── Pacientes view ── */}
                    {visao === 'pacientes' && (
                        <>
                            <div className='medico-filtros-header'>
                                <h2>Filtros:</h2>
                                <div className='medico-acoes-header'>
                                    <button
                                        onClick={() => setModalConsultarAberto(true)}
                                        className='btn-acao-header'
                                    >
                                        + Consultar Paciente
                                    </button>
                                    <button
                                        onClick={() => setModalCadastrarAberto(true)}
                                        className='btn-acao-header btn-acao-primario'
                                    >
                                        + Inserir Paciente
                                    </button>
                                </div>
                            </div>

                            <SortChips
                                chips={pacienteSortChips}
                                active={sortField}
                                order={sortOrder}
                                onSort={handleSort}
                            />

                            <div className='medico-tabela-container'>
                                <h3>Lista de pacientes:</h3>
                                <table className='medico-tabela'>
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>Idade</th>
                                            <th>Sexo Biológico</th>
                                            <th>Nascimento</th>
                                            <th>CPF</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedPacientes.map((p, i) => (
                                            <tr key={i}>
                                                <td>{p.nome}</td>
                                                <td>{calcularIdade(p.data_nascimento)} anos</td>
                                                <td>{p.sexo}</td>
                                                <td>{p.data_nascimento.split('-').reverse().join('/')}</td>
                                                <td>{formatarCPF(p.cpf)}</td>
                                                <td>
                                                    <div className='acoes-celula'>
                                                        <button
                                                            className='btn-tabela'
                                                            onClick={() => setPacienteParaEditar(p)}
                                                        >
                                                            <img src={pincelImg} alt="Editar" />
                                                        </button>
                                                        <button
                                                            className='btn-acao btn-acao-fotos'
                                                            onClick={() => setPacienteFotosVisualizar(p)}
                                                            title="Ver fotos"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                                                            </svg>
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
                <Footer />
            </div>

            {/* ── Modals ── */}
            {modalCadastrarAberto && (
                <ModalCadastrarPaciente
                    onFechar={() => {
                        setModalCadastrarAberto(false)
                        fetchData()
                    }}
                />
            )}
            {modalConsultarAberto && (
                <ModalConsultarPacientes onFechar={() => setModalConsultarAberto(false)} />
            )}
            {pacienteParaEditar && (
                <ModalEditarPaciente
                    paciente={pacienteParaEditar}
                    onFechar={() => setPacienteParaEditar(null)}
                    onSucesso={fetchData}
                />
            )}
            {pacienteFotosVisualizar && (
                <ModalFotosPaciente
                    paciente={pacienteFotosVisualizar}
                    onFechar={() => setPacienteFotosVisualizar(null)}
                />
            )}

            {import.meta.env.DEV && (
                <button
                    onClick={() => navigate('/administrador')}
                    style={{
                        position: 'fixed',
                        bottom: 16,
                        right: 16,
                        background: '#ff6b6b',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        opacity: 0.8,
                    }}
                >
                    [DEV] Ir para Admin
                </button>
            )}
        </div>
    )
}

export default PaginaMedicos