import { useNavigate } from 'react-router-dom'
import './barra-principal-estilo.css'
export function BarraPrincipal () {
  const navigate = useNavigate()
  return (
      <div className='barra-principal'>
        <div className='logo'>
          <h2>Logo do projeto</h2>
        </div>
        <div className='informações'>
          <a href="">
            <button onClick={() => navigate('/login-medicos')} className='botao-barra'>
              Login Médicos
            </button>
          </a>
        </div>
      </div>
  )
}