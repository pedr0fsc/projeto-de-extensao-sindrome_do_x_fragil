import { useState } from 'react'
import '../modal-pacientes/modal-pacientes-estilos.css'
import { formatarCPF, formatarTelefone, limparFormatacao } from '../../utils/mascaras'
import { useAlerta } from '../alerta'

interface Props {
    paciente: {
        id: number
        nome: string
        cpf: string
        sexo: string
        data_nascimento: string
        telefone: string
        email: string
        id_instituto: number | null
    }
    onFechar: () => void
    onSucesso: () => void
}

export function ModalEditarPaciente({ paciente, onFechar, onSucesso }: Props) {
    const [nome, setNome] = useState(paciente.nome)
    const [cpf, setCpf] = useState(formatarCPF(paciente.cpf))
    const [dataNascimento, setDataNascimento] = useState(paciente.data_nascimento)
    const [genero, setGenero] = useState(paciente.sexo)
    const [telefone, setTelefone] = useState(formatarTelefone(paciente.telefone))
    const [email, setEmail] = useState(paciente.email)
    const [loading, setLoading] = useState(false)
    const { mostrarAlerta } = useAlerta()

    const handleSalvar = async () => {
        if (!nome.trim() || !cpf.trim() || !genero || !dataNascimento) {
            mostrarAlerta('Por favor, preencha todos os campos obrigatórios (*).', 'erro')
            return
        }
        if (email.trim() && !email.includes('@')) {
            mostrarAlerta('O e-mail informado é inválido (deve conter @).', 'erro')
            return
        }
        setLoading(true)
        try {
            const response = await fetch(`/api/paciente/${paciente.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome,
                    cpf: limparFormatacao(cpf),
                    sexo: genero,
                    data_nascimento: dataNascimento,
                    telefone: limparFormatacao(telefone),
                    email
                })
            })
            const data = await response.json()
            if (data.success) {
                mostrarAlerta('Dados do paciente atualizados com sucesso!', 'sucesso')
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
            <div className='modal-ms' onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className='ms-topo'>
                    <h2>Editar Paciente</h2>
                    <button className='ms-btn-fechar' onClick={onFechar}>✕</button>
                </div>

                <div className='ms-corpo'>
                    <div className='ms-secao'>
                        <div className='ms-campo-full'>
                            <label className='ms-label'>Nome completo *</label>
                            <input 
                                className='ms-input' 
                                type="text" 
                                value={nome} 
                                onChange={e => setNome(e.target.value)} 
                                maxLength={150}
                            />
                        </div>
                        <div className='ms-linha-dupla'>
                            <div className='ms-campo'>
                                <label className='ms-label'>CPF *</label>
                                <input 
                                    className='ms-input' 
                                    type="text" 
                                    value={cpf} 
                                    onChange={e => setCpf(formatarCPF(e.target.value))} 
                                    maxLength={14}
                                />
                            </div>
                            <div className='ms-campo'>
                                <label className='ms-label'>Data de nascimento *</label>
                                <input
                                    className='ms-input'
                                    type="date"
                                    value={dataNascimento}
                                    onChange={e => setDataNascimento(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    min={`${new Date().getFullYear() - 120}-01-01`}
                                />
                            </div>
                        </div>
                        <div className='ms-campo-full'>
                            <label className='ms-label'>Sexo Biológico *</label>
                            <div className='ms-radio-grupo'>
                                {['Masculino', 'Feminino'].map(g => (
                                    <button
                                        key={g}
                                        type="button"
                                        className={`ms-radio-opcao ${genero === g ? 'ms-radio-selecionado' : ''}`}
                                        onClick={() => setGenero(g)}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className='ms-linha-dupla'>
                            <div className='ms-campo'>
                                <label className='ms-label'>Telefone</label>
                                <input 
                                    className='ms-input' 
                                    type="text" 
                                    value={telefone} 
                                    onChange={e => setTelefone(formatarTelefone(e.target.value))} 
                                    maxLength={15}
                                />
                            </div>
                            <div className='ms-campo'>
                                <label className='ms-label'>E-mail</label>
                                <input className='ms-input' type="email" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className='ms-rodape'>
                    <button className='ms-btn-secundario' onClick={onFechar}>
                        Cancelar
                    </button>
                    <button className='ms-btn-primario' onClick={handleSalvar} disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    )
}
