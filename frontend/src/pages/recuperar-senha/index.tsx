import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTransitionNavigate } from '../../hooks/useTransitionNavigate'
import { Footer } from '../../components/footer'
import './pagina-recuperar.css'

export function PaginaResetSenha() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')
    const [senha, setSenha] = useState('')
    const [confirmarSenha, setConfirmarSenha] = useState('')
    const [mostrarSenha, setMostrarSenha] = useState(false)
    const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false)
    const [loading, setLoading] = useState(false)
    const [erro, setErro] = useState('')
    const [sucesso, setSucesso] = useState(false)
    const navigate = useTransitionNavigate()

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        if (senha !== confirmarSenha) {
            setErro('As senhas não coincidem')
            return
        }
        if (senha.length < 6) {
            setErro('A senha deve ter pelo menos 6 caracteres')
            return
        }

        setLoading(true)
        setErro('')
        try {
            const response = await fetch('/api/password-reset/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, senha })
            })
            const data = await response.json()
            if (data.success) {
                setSucesso(true)
            } else {
                setErro(data.error || 'Erro ao resetar senha')
            }
        } catch (err) {
            console.error(err)
            setErro('Erro de conexão com o servidor')
        } finally {
            setLoading(false)
        }
    }

    if (!token) {
        return (
            <div className='reset-page'>
                <div className='reset-layout'>
                    <div className='reset-box' style={{ textAlign: 'center' }}>
                        <h2 style={{ color: '#ff6b6b' }}>Link Inválido</h2>
                        <p>O token de recuperação está ausente ou é inválido.</p>
                        <button className='btn-reset' onClick={() => navigate('/login-medicos')}>
                            Voltar ao Login
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className='reset-page'>
        <div className='reset-layout'>
            <div className='reset-box'>
                {sucesso ? (
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h2 style={{ color: 'var(--cor-secundaria)' }}>Senha Alterada!</h2>
                        <p>Sua senha foi redefinida com sucesso. Você já pode fazer login na plataforma.</p>
                        <button className='btn-reset' onClick={() => navigate('/login-medicos')}>
                            Ir para o Login
                        </button>
                    </div>
                ) : (
                    <>
                        <h2>Nova Senha</h2>
                        <p>Crie uma nova senha segura para sua conta.</p>
                        <form onSubmit={handleReset}>
                            <div className='form-campo'>
                                <label>Nova Senha</label>
                                <div className='password-input-wrapper'>
                                    <input 
                                        type={mostrarSenha ? 'text' : 'password'} 
                                        placeholder="Mínimo 6 caracteres"
                                        value={senha} 
                                        onChange={e => setSenha(e.target.value)} 
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
                            </div>
                            <div className='form-campo'>
                                <label>Confirmar Nova Senha</label>
                                <div className='password-input-wrapper'>
                                    <input 
                                        type={mostrarConfirmarSenha ? 'text' : 'password'} 
                                        placeholder="Confirme sua nova senha"
                                        value={confirmarSenha} 
                                        onChange={e => setConfirmarSenha(e.target.value)} 
                                        required 
                                    />
                                    <button 
                                        type="button" 
                                        className='password-toggle-btn'
                                        onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                                        title={mostrarConfirmarSenha ? "Ocultar senha" : "Mostrar senha"}
                                    >
                                        {mostrarConfirmarSenha ? (
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
                            </div>
                            {erro && <p className='erro-msg'>{erro}</p>}
                            <button type="submit" className='btn-reset' disabled={loading}>
                                {loading ? 'Processando...' : 'Redefinir Senha'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
        <Footer />
        </div>
    )
}
export default PaginaResetSenha
