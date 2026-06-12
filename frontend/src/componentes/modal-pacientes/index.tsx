import { useState, useEffect, useRef } from 'react'
import './modal-pacientes-estilos.css'
import { formatarCPF, formatarTelefone, limparFormatacao } from '../../utils/mascaras'
import { useAlerta } from '../alerta'

interface Props {
    onFechar: () => void
}

const TOTAL_STEPS = 4

const acompanhanteOpcoes = [
    { value: 'mae', label: 'Mãe' },
    { value: 'pai', label: 'Pai' },
    { value: 'outro', label: 'Outro' },
]

const stepsTitulos = ['Dados Básicos', 'Acompanhante', 'Sintomas', 'Fotos']

interface Sintoma {
    id: number
    nome: string
}

interface FotoField {
    key: 'face' | 'esq' | 'dir'
    label: string
    descricao: string
}

const fotoFields: FotoField[] = [
    { key: 'face', label: 'Face (Frente)', descricao: 'Foto frontal do rosto' },
    { key: 'esq', label: 'Perfil Esquerdo', descricao: 'Lado esquerdo do rosto' },
    { key: 'dir', label: 'Perfil Direito', descricao: 'Lado direito do rosto' },
]

const IconeCamera = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 28, height: 28, opacity: 0.4 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
    </svg>
)

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

    // Fotos
    const [fotoFace, setFotoFace] = useState<File | null>(null)
    const [fotoEsq, setFotoEsq] = useState<File | null>(null)
    const [fotoDir, setFotoDir] = useState<File | null>(null)
    const [previewFace, setPreviewFace] = useState('')
    const [previewEsq, setPreviewEsq] = useState('')
    const [previewDir, setPreviewDir] = useState('')

    const inputFaceRef = useRef<HTMLInputElement>(null)
    const inputEsqRef = useRef<HTMLInputElement>(null)
    const inputDirRef = useRef<HTMLInputElement>(null)

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

    const handleSelecionarFoto = (
        e: React.ChangeEvent<HTMLInputElement>,
        setFile: (f: File | null) => void,
        setPreview: (s: string) => void
    ) => {
        const arquivo = e.target.files?.[0] ?? null
        setFile(arquivo)
        if (arquivo) {
            const reader = new FileReader()
            reader.onload = ev => setPreview(ev.target?.result as string)
            reader.readAsDataURL(arquivo)
        } else {
            setPreview('')
        }
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

            // 2. Upload de fotos (se houver)
            if (fotoFace || fotoEsq || fotoDir) {
                const formData = new FormData()
                if (fotoFace) formData.append('foto_face', fotoFace)
                if (fotoEsq) formData.append('foto_perfil_esq', fotoEsq)
                if (fotoDir) formData.append('foto_perfil_dir', fotoDir)
                await fetch(`/api/paciente/${dataPaciente.id}/fotos`, {
                    method: 'POST',
                    body: formData
                })
            }

            // 3. Realizar Triagem
            const sintomasObj: Record<string, boolean> = {}
            sintomasMarcados.forEach(id => { sintomasObj[id.toString()] = true })

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

    const fotoState = {
        face: { file: fotoFace, preview: previewFace, ref: inputFaceRef, set: setFotoFace, setPreview: setPreviewFace },
        esq: { file: fotoEsq, preview: previewEsq, ref: inputEsqRef, set: setFotoEsq, setPreview: setPreviewEsq },
        dir: { file: fotoDir, preview: previewDir, ref: inputDirRef, set: setFotoDir, setPreview: setPreviewDir },
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

                    {step === 4 && (
                        <div className='ms-secao'>
                            <h3 className='ms-secao-titulo'>Fotos do Paciente</h3>
                            <p className='ms-secao-subtitulo'>Opcional — adicione fotos para registro clínico (frente e perfis)</p>
                            <div className='ms-fotos-grid'>
                                {fotoFields.map(campo => {
                                    const state = fotoState[campo.key]
                                    return (
                                        <div key={campo.key} className='ms-foto-campo'>
                                            <span className='ms-foto-label'>{campo.label}</span>
                                            <input
                                                ref={state.ref}
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                style={{ display: 'none' }}
                                                onChange={e => handleSelecionarFoto(e, state.set, state.setPreview)}
                                            />
                                            <button
                                                type="button"
                                                className={`ms-foto-area ${state.preview ? 'ms-foto-area-preenchida' : ''}`}
                                                onClick={() => state.ref.current?.click()}
                                            >
                                                {state.preview ? (
                                                    <img src={state.preview} alt={campo.label} className='ms-foto-preview' />
                                                ) : (
                                                    <div className='ms-foto-placeholder'>
                                                        <IconeCamera />
                                                        <span>{campo.descricao}</span>
                                                        <span className='ms-foto-hint'>Clique para selecionar</span>
                                                    </div>
                                                )}
                                            </button>
                                            {state.preview && (
                                                <button
                                                    type="button"
                                                    className='ms-foto-remover'
                                                    onClick={() => { state.set(null); state.setPreview('') }}
                                                >
                                                    Remover foto
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
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
