import { LoginMedico } from '../../componentes/login-medico'
import medicoImg from '../../assets/medico.png'
import './index.css'

export function LoginMedicos() {
    return (
        <div className='pagina-login'>
            <nav className='nav-login'>
                <button className='btn-nav-login'>
                    <img src={medicoImg} alt="" />
                    Médicos
                </button>
            </nav>
            <div className='login-container'>
                <div className='login-painel-esquerdo'>
                    <h1 className='login-titulo-painel'>Médicos</h1>
                    <div className='login-decoracao'>
                        <div className='circulo-externo'>
                            <div className='circulo-medio'>
                                <div className='circulo-interno'>
                                    <img src={medicoImg} alt="Médico" className='login-icone' />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='login-painel-direito'>
                    <LoginMedico />
                </div>
            </div>
        </div>
    )
}
export default LoginMedicos
