import './modal-fotos-estilos.css'

interface Props {
    paciente: {
        nome: string
        foto_face?: string | null
        foto_perfil_esq?: string | null
        foto_perfil_dir?: string | null
    }
    onFechar: () => void
}

const IconeCamera = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className='foto-placeholder-icone'>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
    </svg>
)

export function ModalFotosPaciente({ paciente, onFechar }: Props) {
    const fotos = [
        { label: 'Face (Frente)', url: paciente.foto_face },
        { label: 'Perfil Esquerdo', url: paciente.foto_perfil_esq },
        { label: 'Perfil Direito', url: paciente.foto_perfil_dir },
    ]

    const temAlgumaFoto = fotos.some(f => f.url)

    return (
        <div className='overlay' onClick={onFechar}>
            <div className='fotos-modal' onClick={e => e.stopPropagation()}>
                <div className='fotos-modal-header'>
                    <div>
                        <h2>Fotos do Paciente</h2>
                        <p className='fotos-modal-subtitulo'>{paciente.nome}</p>
                    </div>
                    <button className='botao-fechar' onClick={onFechar}>✕</button>
                </div>

                {!temAlgumaFoto && (
                    <div className='fotos-sem-registros'>
                        <IconeCamera />
                        <p>Nenhuma foto cadastrada para este paciente.</p>
                    </div>
                )}

                <div className='fotos-grid'>
                    {fotos.map((foto, i) => (
                        <div key={i} className='foto-card'>
                            <span className='foto-card-label'>{foto.label}</span>
                            {foto.url ? (
                                <img
                                    src={foto.url}
                                    alt={foto.label}
                                    className='foto-card-img'
                                />
                            ) : (
                                <div className='foto-card-placeholder'>
                                    <IconeCamera />
                                    <span>Sem foto</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
