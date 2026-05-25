import './administrador-estilos.css'
import { useState } from 'react'
import { ModalCadastrarMedico } from '../../componentes/modal-cadastrar-medico'
import dashboardImg from '../../assets/dashboard.png'
import medicoImg from '../../assets/medico.png'
import pacienteImg from '../../assets/paciente.png'
import administradorImg from '../../assets/administrador.png'
import lupaImg from '../../assets/lupa.png'
import lixeiraImg from '../../assets/lixeira-de-reciclagem.png'
import pincelImg from '../../assets/pincel.png'

type Visao = 'dashboard' | 'medicos' | 'pacientes'

const medicosMock = [
    { nome: 'Dr. João Silva', idade: 35, genero: 'M', crm: '123456' },
    { nome: 'Dra. Ana Lima', idade: 42, genero: 'F', crm: '654321' },
    { nome: 'Dr. Carlos Melo', idade: 38, genero: 'M', crm: '789012' },
]

const pacientesMock = [
    { nome: 'João Silva', idade: '10 anos', genero: 'M', nascimento: '01/01/2016', ultimaConsulta: '20/05/2026' },
    { nome: 'Ana Costa', idade: '8 anos', genero: 'F', nascimento: '15/03/2018', ultimaConsulta: '18/05/2026' },
    { nome: 'Pedro Lima', idade: '12 anos', genero: 'M', nascimento: '22/07/2014', ultimaConsulta: '15/05/2026' },
]

const atividadesMedicos = [
    { medico: 'Dr. João Silva', crm: '123456', consultasMes: 12, totalPacientes: 18 },
    { medico: 'Dra. Ana Lima', crm: '654321', consultasMes: 9, totalPacientes: 14 },
    { medico: 'Dr. Carlos Melo', crm: '789012', consultasMes: 15, totalPacientes: 20 },
]

export function PaginaAdministrador() {
    const [modalCadastrarAberto, setModalCadastrarAberto] = useState(false)
    const [visao, setVisao] = useState<Visao>('dashboard')

    return (
        <div className='admin-layout'>
            <aside className='admin-sidebar'>
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
                                    <span className='dashboard-card-valor'>8</span>
                                    <span className='dashboard-card-sub'>Ativos no sistema</span>
                                </div>
                                <div className='dashboard-card dashboard-card-destaque'>
                                    <span className='dashboard-card-titulo'>Total de Pacientes</span>
                                    <span className='dashboard-card-valor'>48</span>
                                    <span className='dashboard-card-sub'>+5 este mês</span>
                                </div>
                                <div className='dashboard-card dashboard-card-destaque'>
                                    <span className='dashboard-card-titulo'>Consultas este Mês</span>
                                    <span className='dashboard-card-valor'>36</span>
                                    <span className='dashboard-card-sub'>↑ 8 a mais que o mês anterior</span>
                                </div>
                                <div className='dashboard-card dashboard-card-destaque'>
                                    <span className='dashboard-card-titulo'>Diagnósticos este Mês</span>
                                    <span className='dashboard-card-valor'>15</span>
                                    <span className='dashboard-card-sub'>Síndrome do X Frágil</span>
                                </div>
                            </div>

                            <div className='admin-tabela-container'>
                                <h3 className='dashboard-secao-titulo'>Atividade por Médico — Maio 2026</h3>
                                <table className='admin-tabela'>
                                    <thead>
                                        <tr>
                                            <th>Médico</th>
                                            <th>CRM</th>
                                            <th>Consultas este Mês</th>
                                            <th>Total de Pacientes</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {atividadesMedicos.map((a, i) => (
                                            <tr key={i}>
                                                <td>{a.medico}</td>
                                                <td>{a.crm}</td>
                                                <td>{a.consultasMes}</td>
                                                <td>{a.totalPacientes}</td>
                                                <td>
                                                    <span className='status-badge status-ativo'>Ativo</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className='admin-tabela-container'>
                                <h3 className='dashboard-secao-titulo'>Últimos Pacientes Cadastrados</h3>
                                <table className='admin-tabela'>
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>Idade</th>
                                            <th>Gênero</th>
                                            <th>Última Consulta</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pacientesMock.map((p, i) => (
                                            <tr key={i}>
                                                <td>{p.nome}</td>
                                                <td>{p.idade}</td>
                                                <td>{p.genero === 'M' ? 'Masculino' : 'Feminino'}</td>
                                                <td>{p.ultimaConsulta}</td>
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
                                <button className='filtro-chip'>Idade</button>
                                <button className='filtro-chip'>Sexo</button>
                                <button className='filtro-chip'>CRM</button>
                            </div>
                            <div className='admin-tabela-container'>
                                <h3>Lista de médicos:</h3>
                                <table className='admin-tabela'>
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>Idade</th>
                                            <th>M/F</th>
                                            <th>CRM</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {medicosMock.map((m, i) => (
                                            <tr key={i}>
                                                <td>{m.nome}</td>
                                                <td>{m.idade}</td>
                                                <td>{m.genero}</td>
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
                                            <th>M/F</th>
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
                <ModalCadastrarMedico onFechar={() => setModalCadastrarAberto(false)} />
            )}
        </div>
    )
}
export default PaginaAdministrador
