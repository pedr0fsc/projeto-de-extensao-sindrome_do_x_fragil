import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './login-medico-estilos.css'
import { ModalSolicitarRecuperacao } from '../modal-recuperar-senha'

export function LoginMedico() {
    const navigate = useNavigate()
    const [login, setLogin] = useState('')
    const [senha, setSenha] = useState('')
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
                    <input 
                        type="password" 
                        placeholder="Digite sua senha" 
                        className='form-input' 
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        required
                    />
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
