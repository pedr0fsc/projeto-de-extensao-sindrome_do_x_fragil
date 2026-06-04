import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './login-medico-estilos.css'
import { ModalSolicitarRecuperacao } from '../modal-recuperar-senha'

export function LoginMedico() {
    const navigate = useNavigate()
    const [login, setLogin] = useState('')
    const [senha, setSenha] = useState('')
    const [mostrarSenha, setMostrarSenha] = useState(false)
    const [modalRecuperarAberto, setModalRecuperarAberto] = useState(false)
    const [erro, setErro] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setErro('')
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ login, senha })
            })
            
            const data = await response.json()
            
            if (data.success) {
                if (data.tipo === 'Administrador') {
                    navigate('/administrador')
                } else {
                    navigate('/medicos')
                }
            } else {
                setErro(data.error || 'Erro ao realizar login')
            }
        } catch (err) {
            setErro('Erro de conexão com o servidor')
            console.error(err)
        }
    }

    return (
        <div className='form-login-wrapper'>
            <h1 className='form-login-titulo'>LOGIN</h1>
            <form className='form-login' onSubmit={handleLogin}>
                {erro && <p style={{ color: 'red', textAlign: 'center' }}>{erro}</p>}
                <div className='form-grupo'>
                    <label className='form-label'>Nome de usuário</label>
                    <input 
                        type="text" 
                        placeholder="Digite seu usuário" 
                        className='form-input' 
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        required
                    />
                </div>
                <div className='form-grupo'>
                    <label className='form-label'>Senha</label>
                    <div className='password-input-wrapper'>
                        <input 
                            type={mostrarSenha ? 'text' : 'password'} 
                            placeholder="Digite sua senha" 
                            className='form-input' 
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            required
                        />
                        <button 
                            type="button" 
                            className='password-toggle-btn'
                            onClick={() => setMostrarSenha(!mostrarSenha)}
                            title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                        >
                            {mostrarSenha ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <a 
                        href="#" 
                        className='form-esqueceu'
                        onClick={(e) => { e.preventDefault(); setModalRecuperarAberto(true); }}
                    >
                        Esqueceu sua senha?
                    </a>
                </div>
                <button type="submit" className='form-btn-entrar'>ENTRAR</button>
            </form>

            {modalRecuperarAberto && (
                <ModalSolicitarRecuperacao onFechar={() => setModalRecuperarAberto(false)} />
            )}
        </div>
    )
}
export default LoginMedico
