import { useState, useEffect } from 'react'
import './modal-pacientes-estilos.css'
import { formatarCPF, formatarTelefone, limparFormatacao } from '../../utils/mascaras'
import { useAlerta } from '../alerta'

interface Props {
    onFechar: () => void
}

const TOTAL_STEPS = 3

const acompanhanteOpcoes = [
    { value: 'mae', label: 'Mãe' },
    { value: 'pai', label: 'Pai' },
    { value: 'outro', label: 'Outro' },
]

const stepsTitulos = ['Dados Básicos', 'Acompanhante', 'Sintomas']

interface Sintoma {
    id: number
    nome: string
}

export function ModalCadastrarPaciente({ onFechar }: Props) {
    const [step, setStep] = useState(1)
    
    // Dados Básicos
    const [nome, setNome] = useState('')
    const [cpf, setCpf] = useState('')
    const [dataNascimento, setDataNascimento] = useState('')
    const [genero, setGenero] = useState('')
    const [telefone, setTelefone] = useState('')
    const [email, setEmail] = useState('')
    
    // Acompanhante
    const [tipoAcompanhante, setTipoAcompanhante] = useState('')
    const [nomeAcompanhante, setNomeAcompanhante] = useState('')
    const [observacoes, setObservacoes] = useState('')
    
    // Sintomas
    const [sintomasList, setSintomasList] = useState<Sintoma[]>([])
    const [sintomasMarcados, setSintomasMarcados] = useState<number[]>([])

    const [loading, setLoading] = useState(false)
    const { mostrarAlerta } = useAlerta()

    useEffect(() => {
        fetch('/api/sintomas')
            .then(res => res.json())
            .then(data => setSintomasList(data))
            .catch(err => console.error("Erro ao carregar sintomas", err))
    }, [])

    const toggleSintoma = (id: number) => {
        setSintomasMarcados(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        )
    }

    const handleConcluir = async () => {
        setLoading(true)
        try {
            // 1. Cadastrar Paciente
            const resPaciente = await fetch('/api/paciente/cadastrar', {
                method: 'POST',
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
            const dataPaciente = await resPaciente.json()

            if (!dataPaciente.success) {
                mostrarAlerta('Erro ao cadastrar paciente: ' + (dataPaciente.detail || 'Erro desconhecido'), 'erro')
                setLoading(false)
                return
            }

            // 2. Realizar Triagem
            const sintomasObj: Record<string, boolean> = {}
            sintomasMarcados.forEach(id => {
                sintomasObj[id.toString()] = true
            })

            const resTriagem = await fetch('/api/triagem/calcular', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paciente_id: dataPaciente.id,
                    sintomas: sintomasObj,
                    nome_responsavel: nomeAcompanhante,
                    grau_responsavel: tipoAcompanhante,
                    observacoes: observacoes
                })
            })
            const dataTriagem = await resTriagem.json()

            if (dataTriagem.triagem_id) {
                mostrarAlerta(`Triagem concluída! Score: ${dataTriagem.score}. Recomendação: ${dataTriagem.recomendacao}`, 'sucesso')
                onFechar()
            } else {
                mostrarAlerta('Erro ao realizar triagem', 'erro')
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
            <div className='modal-ms' onClick={(e) => e.stopPropagation()}>

                {/* Topo */}
                <div className='ms-topo'>
                    <h2>Adicionar Paciente</h2>
                    <button className='ms-btn-fechar' onClick={onFechar}>✕</button>
                </div>

                {/* Indicador de steps */}
                <div className='ms-steps'>
                    {stepsTitulos.flatMap((titulo, i) => {
                        const num = i + 1
                        const ativo = num === step
                        const concluido = num < step
                        const items = [
                            <div key={`step-${num}`} className='ms-step-item'>
                                <div className={`ms-circulo ${ativo ? 'ms-ativo' : ''} ${concluido ? 'ms-concluido' : ''}`}>
                                    {num}
                                </div>
                                <span className={`ms-step-nome ${ativo || concluido ? 'ms-step-nome-ativo' : ''}`}>
                                    {titulo}
                                </span>
                            </div>
                        ]
                        if (i < stepsTitulos.length - 1) {
                            items.push(
                                <div key={`line-${i}`} className={`ms-conector ${concluido ? 'ms-conector-ativo' : ''}`} />
                            )
                        }
                        return items
                    })}
                </div>

                {/* Conteúdo */}
                <div className='ms-corpo'>

                    {step === 1 && (
                        <div className='ms-secao'>
                            <h3 className='ms-secao-titulo'>Dados Básicos</h3>
                            <div className='ms-campo-full'>
                                <label className='ms-label'>Nome completo</label>
                                <input 
                                    className='ms-input' 
                                    type="text" 
                                    placeholder="Digite o nome completo" 
                                    value={nome} 
                                    onChange={e => setNome(e.target.value)} 
                                    maxLength={150}
                                />
                            </div>
                            <div className='ms-linha-dupla'>
                                <div className='ms-campo'>
                                    <label className='ms-label'>CPF</label>
                                    <input 
                                        className='ms-input' 
                                        type="text" 
                                        placeholder="000.000.000-00" 
                                        value={cpf} 
                                        onChange={e => setCpf(formatarCPF(e.target.value))} 
                                        maxLength={14}
                                    />
                                </div>
                                <div className='ms-campo'>
                                    <label className='ms-label'>Data de nascimento</label>
                                    <input className='ms-input' type="date" value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} />
                                </div>
                            </div>
                            <div className='ms-campo-full'>
                                <label className='ms-label'>Sexo Biológico</label>
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
                                        placeholder="(00) 00000-0000" 
                                        value={telefone} 
                                        onChange={e => setTelefone(formatarTelefone(e.target.value))} 
                                        maxLength={15}
                                    />
                                </div>
                                <div className='ms-campo'>
                                    <label className='ms-label'>E-mail</label>
                                    <input className='ms-input' type="email" placeholder="Digite o e-mail" value={email} onChange={e => setEmail(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className='ms-secao'>
                            <h3 className='ms-secao-titulo'>Dados do Acompanhante</h3>
                            <div className='ms-campo-full'>
                                <label className='ms-label'>Tipo de acompanhante</label>
                                <select className='ms-select' value={tipoAcompanhante} onChange={e => setTipoAcompanhante(e.target.value)}>
                                    <option value="">Selecione</option>
                                    {acompanhanteOpcoes.map(a => (
                                        <option key={a.value} value={a.label}>{a.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className='ms-campo-full'>
                                <label className='ms-label'>Nome do acompanhante</label>
                                <input className='ms-input' type="text" placeholder="Digite o nome do acompanhante" value={nomeAcompanhante} onChange={e => setNomeAcompanhante(e.target.value)} />
                            </div>
                            <div className='ms-campo-full'>
                                <label className='ms-label'>Observações</label>
                                <textarea className='ms-textarea' placeholder="Observações adicionais sobre o paciente..." value={observacoes} onChange={e => setObservacoes(e.target.value)} />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className='ms-secao'>
                            <h3 className='ms-secao-titulo'>Sintomas observados</h3>
                            <p className='ms-secao-subtitulo'>Selecione todos os sintomas que o paciente apresenta</p>
                            <div className='ms-sintomas-grid'>
                                {sintomasList.map(s => (
                                    <label
                                        key={s.id}
                                        className={`ms-sintoma-card ${sintomasMarcados.includes(s.id) ? 'ms-sintoma-marcado' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            className='ms-sintoma-check'
                                            checked={sintomasMarcados.includes(s.id)}
                                            onChange={() => toggleSintoma(s.id)}
                                        />
                                        {s.nome}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* Rodapé */}
                <div className='ms-rodape'>
                    {step > 1 ? (
                        <button className='ms-btn-secundario' onClick={() => setStep(s => s - 1)}>
                            Anterior
                        </button>
                    ) : (
                        <button className='ms-btn-secundario' onClick={onFechar}>
                            Cancelar
                        </button>
                    )}
                    {step < TOTAL_STEPS ? (
                        <button className='ms-btn-primario' onClick={() => setStep(s => s + 1)}>
                            Salvar e Continuar
                        </button>
                    ) : (
                        <button className='ms-btn-primario' onClick={handleConcluir} disabled={loading}>
                            {loading ? 'Processando...' : 'Concluir'}
                        </button>
                    )}
                </div>

            </div>
        </div>
    )
}

