import { useNavigate } from 'react-router-dom'
import './barra-principal-estilo.css'
import medicoImg from '../../assets/medico.png'

export function BarraPrincipal() {
    const navigate = useNavigate()
    return (
        <div className='barra-principal'>
            <div className='logo'>
                <h2>Logo do projeto</h2>
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
