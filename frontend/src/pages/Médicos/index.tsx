import './pagina-medicos.css'
export function PaginaMedicos() {
    return (
        <>
        <div className='barra-principal'>
        <div className='logo'>
          <h2>Logo do projeto</h2>
        </div>
        <div className='informações'>
          <p>Olá, médico!</p> # Exemplo de informação personalizada para o médico
        </div>
      </div>
        <div className='identificacao'>
            <h1>Bem-vindo à página dos médicos!</h1>
            <p>Aqui você pode acessar informações e recursos relacionados à Síndrome do X Frágil.</p>
        </div>
        <div className='pacientes-cadastrados'>
            <h2 className='titulo-pacientes-cadastrados'>Pacientes cadastrados pelo médico</h2>
            <div>
                <section className='tabela-pacientes'>
                    <div className='ident-informacoes'>
                        <div className='cadastro-pacientes'>
                            <h3>Nome</h3>
                            <h3>Idade</h3>
                            <h3>Gênero</h3>
                            <h3>Data de nascimento</h3>
                            <h3>Data da última consulta </h3>
                            <h3>Ações</h3>
                        </div>
                    </div>
                    <div className='dados-pacientes'>
                        <div className='linha-paciente'>
                            <p>João Silva</p>
                            <p>10 anos</p>
                            <p>Masculino</p>
                            <p>01/01/2016</p>
                            <p>01/01/2024</p>
                            <p>
                                <button>Editar</button>
                                <button>Excluir</button>
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
        </>
    )
}
export default PaginaMedicos