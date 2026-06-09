import { useTransitionNavigate } from '../../hooks/useTransitionNavigate'
import { Footer } from '../../componentes/footer'
import './nao-encontrado-estilos.css'

export function NaoEncontrado() {
    const navigate = useTransitionNavigate()

    return (
        <div className='erro-page'>
            <div className='erro-layout'>
                <div className='erro-container'>
                    <div className='erro-codigo'>404</div>
                    <div className='erro-divisor' />
                    <h1 className='erro-titulo'>Página não encontrada</h1>
                    <p className='erro-descricao'>
                        O endereço que você tentou acessar não existe ou foi removido.
                    </p>
                    <div className='erro-acoes'>
                        <button className='erro-btn-primario' onClick={() => navigate('/')}>
                            Voltar para o início
                        </button>
                        <button className='erro-btn-secundario' onClick={() => navigate(-1)}>
                            Voltar à página anterior
                        </button>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default NaoEncontrado
