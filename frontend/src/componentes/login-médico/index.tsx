import { useNavigate } from 'react-router-dom'
import './login-medico-estilos.css'

export function LoginMedico() {
    const navigate = useNavigate()
    return (
        <div className='form-login-wrapper'>
            <h1 className='form-login-titulo'>LOGIN</h1>
            <form className='form-login' onSubmit={(e) => { e.preventDefault(); navigate('/pagina-medicos') }}>
                <div className='form-grupo'>
                    <label className='form-label'>Nome de usuário</label>
                    <input type="text" placeholder="Digite seu usuário" className='form-input' />
                </div>
                <div className='form-grupo'>
                    <label className='form-label'>Senha</label>
                    <input type="password" placeholder="Digite sua senha" className='form-input' />
                    <a href="#" className='form-esqueceu'>Esqueceu sua senha?</a>
                </div>
                <button type="submit" className='form-btn-entrar'>ENTRAR</button>
            </form>
        </div>
    )
}
export default LoginMedico
