import './bloco-secundario-estilos.css'

export function BlocoSecundario() {
    return (
        <div className='bloco-sobre'>
            <div className='titulo-sobre'>
                <h2>Sobre o SXF</h2>
            </div>
            <div className='colunas-sobre'>
                <div className='coluna-sobre'>
                    <h3>O que é a Síndrome do X Frágil?</h3>
                    <p>É a causa hereditária mais comum de deficiência intelectual e autismo. Causada pela mutação do gene FMR1 no cromossomo X, que reduz ou elimina a produção da proteína FMRP, essencial para o desenvolvimento cerebral.</p>
                </div>
                <div className='coluna-sobre'>
                    <h3>Sobre o projeto</h3>
                    <p>Este sistema visa facilitar o acompanhamento clínico de pacientes com Síndrome do X Frágil, conectando médicos, pacientes e cuidadores em uma plataforma centralizada e acessível.</p>
                </div>
            </div>
        </div>
    )
}
