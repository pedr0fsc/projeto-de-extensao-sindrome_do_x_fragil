import { useState } from 'react'
import './recuperar-senha-estilos.css'
import { useAlerta } from '../alerta'

interface Props {
    onFechar: () => void
}

export function ModalSolicitarRecuperacao({ onFechar }: Props) {
    const { mostrarAlerta } = useAlerta()
    const [login, setLogin] = useState('')
    const [loading, setLoading] = useState(false)
    const [sucesso, setSucesso] = useState(false)
    const [erroNaoEncontrado, setErroNaoEncontrado] = useState(false)

    const handleSolicitar = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErroNaoEncontrado(false)
        try {
            const response = await fetch('/api/password-reset/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login })
            })
            const data = await response.json()
            if (data.success) {
                setSucesso(true)
            } else if (data.not_found) {
                setErroNaoEncontrado(true)
            } else {
                mostrarAlerta('Erro ao solicitar recuperação', 'erro')
            }
        } catch (err) {
            console.error(err)
            mostrarAlerta('Erro de conexão', 'erro')
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
                            <p>Um e-mail de recuperação foi enviado.</p>
                            <p>Verifique sua caixa de entrada e spam.</p>
                            <button className='btn-voltar' onClick={onFechar} style={{ marginTop: '10px' }}>Voltar ao Login</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSolicitar}>
                            <p>Informe seu CPF ou E-mail cadastrado para receber o link de recuperação.</p>
                            <div className='form-campo'>
                                <input 
                                    type="text" 
                                    value={login} 
                                    onChange={e => { setLogin(e.target.value); setErroNaoEncontrado(false) }} 
                                    placeholder="000.000.000-00 ou email@exemplo.com"
                                    required
                                />
                            </div>
                            {erroNaoEncontrado && (
                                <p className='msg-nao-encontrado'>Usuário não encontrado!</p>
                            )}
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
