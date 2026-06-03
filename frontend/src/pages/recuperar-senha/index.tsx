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
                alert('Senha alterada com sucesso! Você já pode fazer login.')
                navigate('/login-medicos')
            } else {
                setErro(data.error || 'Erro ao resetar senha')
            }
        } catch (err) {
            console.error(err)
            setErro('Erro de conexão')
        } finally {
            setLoading(false)
        }
    }

    if (!token) {
        return <div className='reset-container'>Link inválido</div>
    }

    return (
        <div className='reset-layout'>
            <div className='reset-box'>
                <h2>Nova Senha</h2>
                <p>Crie uma nova senha para sua conta.</p>
                <form onSubmit={handleReset}>
                    <div className='form-campo'>
                        <label>Nova Senha</label>
                        <input 
                            type="password" 
                            value={senha} 
                            onChange={e => setSenha(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className='form-campo'>
                        <label>Confirmar Nova Senha</label>
                        <input 
                            type="password" 
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
            </div>
        </div>
    )
}
export default PaginaResetSenha
