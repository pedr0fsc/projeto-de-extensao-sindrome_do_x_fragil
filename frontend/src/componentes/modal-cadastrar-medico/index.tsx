import { useState } from 'react'
import './modal-cadastrar-medico-estilos.css'
import { formatarCPF, formatarTelefone, limparFormatacao } from '../../utils/mascaras'

interface Props {
    onFechar: () => void
}

export function ModalCadastrarMedico({ onFechar }: Props) {
    const [nome, setNome] = useState('')
    const [email, setEmail] = useState('')
    const [cpf, setCpf] = useState('')
    const [senha, setSenha] = useState('')
    const [telefone, setTelefone] = useState('')
    const [crm, setCrm] = useState('')
    const [tipo, setTipo] = useState<'Médico' | 'Administrador'>('Médico')
    const [loading, setLoading] = useState(false)

    const handleConcluir = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/usuario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome,
                    email,
                    cpf: limparFormatacao(cpf),
                    senha,
                    telefone: limparFormatacao(telefone),
                    tipo,
                    crm: tipo === 'Médico' ? crm : undefined
                })
            })
            const data = await response.json()
            if (data.success) {
                alert('Usuário cadastrado com sucesso!')
                onFechar()
            } else {
                alert('Erro ao cadastrar: ' + (data.detail || 'Erro desconhecido'))
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
                    <h2>Adicionar {tipo}:</h2>
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
                                placeholder="000.000.000-00"
                            />
                        </div>
                        <div className='form-campo'>
                            <label>Senha</label>
                            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} />
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
                                placeholder="(00) 00000-0000"
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
                    <button className='botao-concluir' onClick={handleConcluir} disabled={loading}>
                        {loading ? 'Salvando...' : 'Concluir'}
                    </button>
                    <button className='botao-cancelar' onClick={onFechar}>Cancelar</button>
                </div>

            </div>
        </div>
    )
}
export default ModalCadastrarMedico