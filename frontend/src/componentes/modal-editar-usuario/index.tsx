import { useState, useEffect } from 'react'
import '../modal-cadastrar-medico/modal-cadastrar-medico-estilos.css'
import { formatarCPF, formatarTelefone, formatarCRM, validarEmail, limparFormatacao } from '../../utils/mascaras'
import { useAlerta } from '../alerta'

interface Props {
    usuario: {
        id: number
        nome: string
        email: string
        cpf: string
        telefone: string
        tipo: string
        crm?: string
        id_instituto?: number | null
    }
    onFechar: () => void
    onSucesso: () => void
}

interface Instituicao {
    id: number
    nome_fantasia: string
}

export function ModalEditarUsuario({ usuario, onFechar, onSucesso }: Props) {
    const [nome, setNome] = useState(usuario.nome)
    const [email, setEmail] = useState(usuario.email)
    const [cpf, setCpf] = useState(formatarCPF(usuario.cpf))
    const [telefone, setTelefone] = useState(formatarTelefone(usuario.telefone))
    const [crm, setCrm] = useState(usuario.crm || '')
    const [idInstituto, setIdInstituto] = useState<number | ''>(usuario.id_instituto || '')
    const [instituicoes, setInstituicoes] = useState<Instituicao[]>([])
    const [tipo, setTipo] = useState<'Médico' | 'Administrador'>(usuario.tipo as any)
    const [loading, setLoading] = useState(false)
    const { mostrarAlerta } = useAlerta()

    const [tentouSubmit, setTentouSubmit] = useState(false)

    useEffect(() => {
        fetch('/api/instituicoes')
            .then(res => res.json())
            .then(data => setInstituicoes(data || []))
            .catch(err => console.error('Erro ao carregar instituições:', err))
    }, [])

    const erroEmail = !validarEmail(email)

    const handleSalvar = async () => {
        setTentouSubmit(true)
        if (erroEmail) return
        setLoading(true)
        try {
            const response = await fetch(`/api/usuario/${usuario.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome,
                    email,
                    cpf: limparFormatacao(cpf),
                    telefone: limparFormatacao(telefone),
                    tipo,
                    crm: tipo === 'Médico' ? crm : undefined,
                    id_instituto: idInstituto || undefined
                })
            })
            const data = await response.json()
            if (data.success) {
                mostrarAlerta('Usuário atualizado com sucesso!', 'sucesso')
                onSucesso()
                onFechar()
            } else {
                mostrarAlerta('Erro ao atualizar: ' + (data.detail || 'Erro desconhecido'), 'erro')
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
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className={tentouSubmit && erroEmail ? 'input-erro' : ''}
                        />
                        {tentouSubmit && erroEmail && <p className='campo-erro-msg'>E-mail inválido (deve conter @)</p>}
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
                            <label>Telefone</label>
                            <input 
                                type="text" 
                                value={telefone} 
                                onChange={e => setTelefone(formatarTelefone(e.target.value))} 
                                maxLength={15}
                            />
                        </div>
                    </div>
                    <div className='form-linha'>
                        <div className='form-campo'>
                            <label>Tipo</label>
                            <select value={tipo} onChange={e => setTipo(e.target.value as any)}>
                                <option value="Médico">Médico</option>
                                <option value="Administrador">Administrador</option>
                            </select>
                        </div>
                    </div>
                    {tipo === 'Médico' && (
                        <div className='form-linha'>
                            <div className='form-campo'>
                                <label>CRM</label>
                                <input
                                    type="text"
                                    value={crm}
                                    onChange={e => setCrm(formatarCRM(e.target.value))}
                                    maxLength={9}
                                    placeholder="000000/SP"
                                />
                            </div>
                            <div className='form-campo'>
                                <label>Instituição</label>
                                <select value={idInstituto} onChange={e => setIdInstituto(Number(e.target.value))}>
                                    <option value="">Selecione uma instituição</option>
                                    {instituicoes.map(inst => (
                                        <option key={inst.id} value={inst.id}>{inst.nome_fantasia}</option>
                                    ))}
                                </select>
                            </div>
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
