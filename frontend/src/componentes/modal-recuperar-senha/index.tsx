import { useState } from 'react'
import './recuperar-senha-estilos.css'

interface Props {
    onFechar: () => void
}

export function ModalSolicitarRecuperacao({ onFechar }: Props) {
    const [login, setLogin] = useState('')
    const [loading, setLoading] = useState(false)
    const [sucesso, setSucesso] = useState(false)

    const handleSolicitar = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const response = await fetch('/api/password-reset/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login })
            })
            const data = await response.json()
            if (data.success) {
                setSucesso(true)
            } else {
                alert('Erro ao solicitar recuperação')
            }
        } catch (err) {
            console.error(err)
            alert('Erro de conexão')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='overlay' onClick={onFechar}>
            <div className='modal-recuperar' onClick={e => e.stopPropagation()}>
                <div className='modal-header'>
                    <h2>Recuperar Senha</h2>
                    <button className='botao-fechar' onClick={onFechar}>✕</button>
                </div>
                
                <div className='modal-corpo'>
                    {sucesso ? (
                        <div className='mensagem-sucesso'>
                            <p>Se o usuário existir, um e-mail com as instruções foi enviado.</p>
                            <p>Verifique sua caixa de entrada e spam.</p>
                            <button className='btn-voltar' onClick={onFechar}>Voltar ao Login</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSolicitar}>
                            <p>Informe seu CPF ou E-mail cadastrado para receber o link de recuperação.</p>
                            <div className='form-campo'>
                                <label>CPF ou E-mail</label>
                                <input 
                                    type="text" 
                                    value={login} 
                                    onChange={e => setLogin(e.target.value)} 
                                    placeholder="000.000.000-00 ou email@exemplo.com"
                                    required
                                />
                            </div>
                            <button type="submit" className='btn-enviar' disabled={loading}>
                                {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
