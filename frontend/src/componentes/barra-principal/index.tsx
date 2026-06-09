import { useTransitionNavigate } from '../../hooks/useTransitionNavigate'
import './barra-principal-estilo.css'
import medicoImg from '../../assets/medico.png'
import logoImg from '../../assets/logo.png'

export function BarraPrincipal() {
    const navigate = useTransitionNavigate()
    return (
        <div className='barra-principal'>
            <div className='logo'>
                <img src={logoImg} alt="" width="150"/>
            </div>
            <div className='botoes-barra-wrapper'>
                <button onClick={() => navigate('/login-medicos')} className='botao-barra'>
                    <img src={medicoImg} alt="" />
                    LOGIN Médicos
                </button>
            </div>
        </div>
    )
}
