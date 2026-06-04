import { useState } from 'react'
import '../modal-cadastrar-medico/modal-cadastrar-medico-estilos.css'
import { formatarCPF, formatarTelefone, limparFormatacao } from '../../utils/mascaras'

interface Props {
    usuario: {
        id: number
        nome: string
        email: string
        cpf: string
        telefone: string
        tipo: string
        crm?: string
    }
    onFechar: () => void
    onSucesso: () => void
}

export function ModalEditarUsuario({ usuario, onFechar, onSucesso }: Props) {
    const [nome, setNome] = useState(usuario.nome)
    const [email, setEmail] = useState(usuario.email)
    const [cpf, setCpf] = useState(formatarCPF(usuario.cpf))
    const [senha, setSenha] = useState('')
    const [mostrarSenha, setMostrarSenha] = useState(false)
    const [telefone, setTelefone] = useState(formatarTelefone(usuario.telefone))
    const [crm, setCrm] = useState(usuario.crm || '')
    const [tipo, setTipo] = useState<'Médico' | 'Administrador'>(usuario.tipo as any)
    const [loading, setLoading] = useState(false)

    const handleSalvar = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/usuario/${usuario.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome,
                    email,
                    cpf: limparFormatacao(cpf),
                    senha: senha || undefined,
                    telefone: limparFormatacao(telefone),
                    tipo,
                    crm: tipo === 'Médico' ? crm : undefined
                })
            })
            const data = await response.json()
            if (data.success) {
                alert('Usuário atualizado com sucesso!')
                onSucesso()
                onFechar()
            } else {
                alert('Erro ao atualizar: ' + (data.detail || 'Erro desconhecido'))
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
            <div className='modal' onClick={(e) => e.stopPropagation()}>

                <div className='modal-header'>
                    <h2>Editar {tipo}:</h2>
                    <button className='botao-fechar' onClick={onFechar}>✕</button>
                </div>

                <div className='modal-corpo'>
                    <div className='form-campo'>
                        <label>Nome completo</label>
                        <input type="text" value={nome} onChange={e => setNome(e.target.value)} />
                    </div>
                    <div className='form-campo'>
                        <label>E-mail</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className='form-linha'>
                        <div className='form-campo'>
                            <label>CPF</label>
                            <input 
                                type="text" 
                                value={cpf} 
                                onChange={e => setCpf(formatarCPF(e.target.value))} 
                                maxLength={14}
                            />
                        </div>
                        <div className='form-campo'>
                            <label>Nova Senha (deixe vazio se não quiser alterar)</label>
                            <div className='password-input-wrapper'>
                                <input 
                                    type={mostrarSenha ? 'text' : 'password'} 
                                    value={senha} 
                                    onChange={e => setSenha(e.target.value)} 
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
                    </div>
                    <div className='form-linha'>
                        <div className='form-campo'>
                            <label>Telefone</label>
                            <input 
                                type="text" 
                                value={telefone} 
                                onChange={e => setTelefone(formatarTelefone(e.target.value))} 
                                maxLength={15}
                            />
                        </div>
                        <div className='form-campo'>
                            <label>Tipo</label>
                            <select value={tipo} onChange={e => setTipo(e.target.value as any)}>
                                <option value="Médico">Médico</option>
                                <option value="Administrador">Administrador</option>
                            </select>
                        </div>
                    </div>
                    {tipo === 'Médico' && (
                        <div className='form-campo'>
                            <label>CRM</label>
                            <input 
                                type="text" 
                                value={crm} 
                                onChange={e => setCrm(e.target.value)} 
                                maxLength={10}
                            />
                        </div>
                    )}
                </div>

                <div className='modal-rodape'>
                    <button className='botao-concluir' onClick={handleSalvar} disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                    <button className='botao-cancelar' onClick={onFechar}>Cancelar</button>
                </div>

            </div>
        </div>
    )
}
