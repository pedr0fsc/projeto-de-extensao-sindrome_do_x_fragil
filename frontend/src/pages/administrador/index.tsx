import './administrador-estilos.css'
import { useState, useEffect, useMemo } from 'react'
import { ModalCadastrarMedico } from '../../componentes/modal-cadastrar-medico'
import { ModalEditarUsuario } from '../../componentes/modal-editar-usuario'
import { ModalEditarPaciente } from '../../componentes/modal-editar-paciente'
import { useTransitionNavigate } from '../../hooks/useTransitionNavigate'
import dashboardImg from '../../assets/dashboard.png'
import medicoImg from '../../assets/medico.png'
import pacienteImg from '../../assets/paciente.png'
import administradorImg from '../../assets/administrador.png'
import pincelImg from '../../assets/pincel.png'
import { formatarCPF } from '../../utils/mascaras'
import { SearchBar } from '../../componentes/search-bar'
import { Footer } from '../../componentes/footer'

type Visao = 'dashboard' | 'medicos' | 'pacientes'
type SortOrder = 'asc' | 'desc'
type SortMedicosField = 'nome' | 'crm'
type SortPacientesField = 'nome' | 'idade' | 'sexo' | 'nascimento'

interface Medico {
    id: number
    nome: string
    crm: string
    email: string
    cpf: string
    telefone: string
    tipo: string
    ativo: boolean
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

// ─── Reusable sort chips row ──────────────────────────────────────────────────
interface SortChipsProps<T extends string> {
    chips: { label: string; value: T }[]
    active: T
    order: SortOrder
    onSort: (field: T) => void
}

function SortChips<T extends string>({ chips, active, order, onSort }: SortChipsProps<T>) {
    return (
        <div className='admin-filtros'>
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
export function PaginaAdministrador() {
    const [modalCadastrarAberto, setModalCadastrarAberto] = useState(false)
    const [medicoParaEditar, setMedicoParaEditar] = useState<Medico | null>(null)
    const [pacienteParaEditar, setPacienteParaEditar] = useState<Paciente | null>(null)
    const [visao, setVisao] = useState<Visao>('dashboard')
    const [medicos, setMedicos] = useState<Medico[]>([])
    const [pacientes, setPacientes] = useState<Paciente[]>([])
    const [relatorios, setRelatorios] = useState<Relatorio[]>([])
    const [stats, setStats] = useState({
        totalMedicos: 0,
        totalPacientes: 0,
        totalTriagens: 0,
        encaminhados: 0,
    })
    const [loading, setLoading] = useState(true)
    const navigate = useTransitionNavigate()

    // One search term per view — no cross-tab bleed
    const [searchDashboard, setSearchDashboard] = useState('')
    const [searchMedicos, setSearchMedicos] = useState('')
    const [searchPacientes, setSearchPacientes] = useState('')

    const activeSearch =
        visao === 'dashboard' ? searchDashboard :
        visao === 'medicos' ? searchMedicos :
        searchPacientes

    const setActiveSearch = (val: string) => {
        if (visao === 'dashboard') setSearchDashboard(val)
        else if (visao === 'medicos') setSearchMedicos(val)
        else setSearchPacientes(val)
    }

    // Sort states
    const [sortMedicosField, setSortMedicosField] = useState<SortMedicosField>('nome')
    const [sortMedicosOrder, setSortMedicosOrder] = useState<SortOrder>('asc')
    const [sortPacientesField, setSortPacientesField] = useState<SortPacientesField>('nome')
    const [sortPacientesOrder, setSortPacientesOrder] = useState<SortOrder>('asc')

    const handleSortMedicos = (field: SortMedicosField) => {
        if (sortMedicosField === field) setSortMedicosOrder(o => (o === 'asc' ? 'desc' : 'asc'))
        else { setSortMedicosField(field); setSortMedicosOrder('asc') }
    }

    const handleSortPacientes = (field: SortPacientesField) => {
        if (sortPacientesField === field) setSortPacientesOrder(o => (o === 'asc' ? 'desc' : 'asc'))
        else { setSortPacientesField(field); setSortPacientesOrder('asc') }
    }

    const alternarStatusMedico = async (medico: Medico) => {
        try {
            const response = await fetch(`/api/usuario/${medico.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: medico.nome,
                    email: medico.email,
                    cpf: medico.cpf,
                    telefone: medico.telefone,
                    tipo: medico.tipo,
                    crm: medico.crm,
                    ativo: !medico.ativo,
                }),
            })

            const data = await response.json()
            if (!response.ok || !data.success) {
                alert('Não foi possível alterar o status do médico.')
                return
            }

            await fetchData()
        } catch (err) {
            console.error('Erro ao alterar status do médico:', err)
            alert('Erro de conexão ao alterar status do médico.')
        }
    }

    // ── Filtered + sorted lists ──────────────────────────────────────────────

    // Dashboard: médicos activity table filtered by dashboard search
    const atividadesMedicos = useMemo(() => {
        const term = searchDashboard.toLowerCase()
        return medicos
            .map(m => {
                const triagensMedico = relatorios.filter(r => r.medico === m.nome)
                return {
                    medico: m.nome,
                    crm: m.crm,
                    ativo: m.ativo,
                    consultas: triagensMedico.length,
                    pacientes: new Set(triagensMedico.map(r => r.paciente)).size,
                }
            })
            .filter(a =>
                !term ||
                a.medico.toLowerCase().includes(term) ||
                a.crm.toLowerCase().includes(term) ||
                a.consultas.toString().includes(term) ||
                a.pacientes.toString().includes(term)
            )
    }, [medicos, relatorios, searchDashboard])

    // Dashboard: últimas triagens filtered by dashboard search
    const filteredRelatoriosDashboard = useMemo(() => {
        const term = searchDashboard.toLowerCase()
        if (!term) return relatorios.slice(0, 5)
        return relatorios
            .filter(r =>
                r.paciente.toLowerCase().includes(term) ||
                r.sexo.toLowerCase().includes(term) ||
                r.medico.toLowerCase().includes(term) ||
                r.data.includes(term) ||
                r.score.toString().includes(term)
            )
            .slice(0, 5)
    }, [relatorios, searchDashboard])

    // Médicos view: filtered + sorted
    const sortedMedicos = useMemo(() => {
        const term = searchMedicos.toLowerCase()
        const filtered = term
            ? medicos.filter(m =>
                m.nome.toLowerCase().includes(term) ||
                m.crm.toLowerCase().includes(term) ||
                m.cpf.includes(term) ||
                m.email.toLowerCase().includes(term) ||
                m.telefone.includes(term)
            )
            : [...medicos]

        return filtered.sort((a, b) => {
            const valA = a[sortMedicosField] || ''
            const valB = b[sortMedicosField] || ''
            if (valA < valB) return sortMedicosOrder === 'asc' ? -1 : 1
            if (valA > valB) return sortMedicosOrder === 'asc' ? 1 : -1
            return 0
        })
    }, [medicos, searchMedicos, sortMedicosField, sortMedicosOrder])

    // Pacientes view: filtered + sorted (includes data_nascimento search)
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

            if (sortPacientesField === 'idade') {
                valA = calcularIdade(a.data_nascimento)
                valB = calcularIdade(b.data_nascimento)
            } else if (sortPacientesField === 'nascimento') {
                valA = a.data_nascimento
                valB = b.data_nascimento
            } else if (sortPacientesField === 'sexo') {
                valA = a.sexo
                valB = b.sexo
            } else {
                valA = a.nome
                valB = b.nome
            }

            if (valA < valB) return sortPacientesOrder === 'asc' ? -1 : 1
            if (valA > valB) return sortPacientesOrder === 'asc' ? 1 : -1
            return 0
        })
    }, [pacientes, searchPacientes, sortPacientesField, sortPacientesOrder])

    // ── Data fetching ────────────────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true)
        try {
            const [resMedicos, resPacientes, resRelatorios, resCheck] = await Promise.all([
                fetch('/api/medicos'),
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
            } else {
                navigate('/login-medicos')
                return
            }

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
                encaminhados: dataRelatorios.encaminhados || 0,
            })
        } catch (err) {
            console.error('Erro ao carregar dados admin:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    if (loading)
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                Carregando Painel Admin...
            </div>
        )

    const medicosSortChips: { label: string; value: SortMedicosField }[] = [
        { label: 'Nome', value: 'nome' },
        { label: 'CRM', value: 'crm' },
    ]

    const pacientesSortChips: { label: string; value: SortPacientesField }[] = [
        { label: 'Nome', value: 'nome' },
        { label: 'Idade', value: 'idade' },
        { label: 'Sexo', value: 'sexo' },
        { label: 'Data de Nascimento', value: 'nascimento' },
    ]

    return (
        <div className='admin-layout'>
            {/* ── Sidebar ── */}
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

            {/* ── Main ── */}
            <div className='admin-main'>
                <header className='admin-topbar'>
                    <SearchBar value={activeSearch} onChange={setActiveSearch} />
                    <label className='admin-perfil'>
                        <img src={administradorImg} alt="" />
                        Administrador
                    </label>
                </header>

                <div className='admin-conteudo'>
                    {/* ── Dashboard view ── */}
                    {visao === 'dashboard' && (
                        <>
                            <h2 className='dashboard-titulo'>Dashboard do Administrador</h2>

                            <div className='dashboard-cards'>
                                <div className='dashboard-card dashboard-card-destaque'>
                                    <span className='dashboard-card-titulo'>Total de Médicos</span>
                                    <span className='dashboard-card-valor'>{stats.totalMedicos}</span>
                                    <span className='dashboard-card-sub'>Cadastrados no sistema</span>
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
                                                    <span className={`status-badge ${a.ativo ? 'status-ativo' : 'status-inativo'}`}>
                                                        {a.ativo ? 'Ativo' : 'Inativo'}
                                                    </span>
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
                                        {filteredRelatoriosDashboard.map((r, i) => (
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

                    {/* ── Médicos view ── */}
                    {visao === 'medicos' && (
                        <div className='admin-secao'>
                            <div className='admin-filtros-header'>
                                <h2>Filtros:</h2>
                                <button onClick={() => setModalCadastrarAberto(true)} className='btn-inserir'>
                                    + Inserir usuário
                                </button>
                            </div>

                            <SortChips
                                chips={medicosSortChips}
                                active={sortMedicosField}
                                order={sortMedicosOrder}
                                onSort={handleSortMedicos}
                            />

                            <div className='admin-tabela-container'>
                                <h3>Lista de usuários:</h3>
                                <table className='admin-tabela'>
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>Tipo</th>
                                            <th>CRM (se médico)</th>
                                            <th>Status</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedMedicos.map((m, i) => (
                                            <tr key={i}>
                                                <td>{m.nome}</td>
                                                <td>{m.tipo}</td>
                                                <td>{m.crm || '-'}</td>
                                                <td>
                                                    <label className='admin-switch'>
                                                        <input
                                                            type='checkbox'
                                                            checked={m.ativo}
                                                            onChange={() => alternarStatusMedico(m)}
                                                        />
                                                        <span>{m.ativo ? 'Ativo' : 'Inativo'}</span>
                                                    </label>
                                                </td>
                                                <td>
                                                    <div className='acoes-celula'>
                                                        <button
                                                            className='btn-acao'
                                                            onClick={() => setMedicoParaEditar(m)}
                                                        >
                                                            <img src={pincelImg} alt="Editar" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── Pacientes view ── */}
                    {visao === 'pacientes' && (
                        <div className='admin-secao'>
                            <div className='admin-filtros-header'>
                                <h2>Filtros:</h2>
                            </div>

                            <SortChips
                                chips={pacientesSortChips}
                                active={sortPacientesField}
                                order={sortPacientesOrder}
                                onSort={handleSortPacientes}
                            />

                            <div className='admin-tabela-container'>
                                <h3>Lista de pacientes:</h3>
                                <table className='admin-tabela'>
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
                                                            className='btn-acao'
                                                            onClick={() => setPacienteParaEditar(p)}
                                                        >
                                                            <img src={pincelImg} alt="Editar" />
                                                        </button>
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
                <Footer />
            </div>

            {/* ── Modals ── */}
            {modalCadastrarAberto && (
                <ModalCadastrarMedico
                    onFechar={() => {
                        setModalCadastrarAberto(false)
                        fetchData()
                    }}
                />
            )}
            {medicoParaEditar && (
                <ModalEditarUsuario
                    usuario={medicoParaEditar}
                    onFechar={() => setMedicoParaEditar(null)}
                    onSucesso={fetchData}
                />
            )}
            {pacienteParaEditar && (
                <ModalEditarPaciente
                    paciente={pacienteParaEditar}
                    onFechar={() => setPacienteParaEditar(null)}
                    onSucesso={fetchData}
                />
            )}
        </div>
    )
}

export default PaginaAdministrador