import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import './pagina-recuperar.css'

export function PaginaResetSenha() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')
    const [senha, setSenha] = useState('')
    const [confirmarSenha, setConfirmarSenha] = useState('')
    const [loading, setLoading] = useState(false)
    const [erro, setErro] = useState('')
    const [sucesso, setSucesso] = useState(false)
    const navigate = useNavigate()

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
            <div className='reset-layout'>
                <div className='reset-box' style={{ textAlign: 'center' }}>
                    <h2 style={{ color: '#ff6b6b' }}>Link Inválido</h2>
                    <p>O token de recuperação está ausente ou é inválido.</p>
                    <button className='btn-reset' onClick={() => navigate('/login-medicos')}>
                        Voltar ao Login
                    </button>
                </div>
            </div>
        )
    }

    return (
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
                                <input 
                                    type="password" 
                                    placeholder="Mínimo 6 caracteres"
                                    value={senha} 
                                    onChange={e => setSenha(e.target.value)} 
                                    required 
                                />
                            </div>
                            <div className='form-campo'>
                                <label>Confirmar Nova Senha</label>
                                <input 
                                    type="password" 
                                    placeholder="Confirme sua nova senha"
                                    value={confirmarSenha} 
                                    onChange={e => setConfirmarSenha(e.target.value)} 
                                    required 
                                />
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
    )
}
export default PaginaResetSenha
