import { useNavigate } from 'react-router-dom'
import './login-medico-estilos.css'
import { Footer } from '../footer'
export function LoginMedico() {
    const navigate = useNavigate()
  return (
    <div className='login-medico'>
      <div className='form-login'>
        <h2>Login Médico</h2>
        <form>
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Senha" />
          <button type="submit" onClick={() => navigate('/pagina-medicos')}>Entrar</button>
          <button onClick={() => navigate('/')}>Voltar</button>
        </form>
      </div>
        <Footer />
    </div>
  )
}
export default LoginMedico