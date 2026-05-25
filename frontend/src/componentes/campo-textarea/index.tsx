import './campo-textarea-estilos.css'

interface Props {
    label: string
    name: string
    placeholder?: string
}

export function CampoTextarea({ label, name, placeholder = '' }: Props) {
    return (
        <div className='campo-textarea-wrapper'>
            <label className='campo-label' htmlFor={name}>{label}</label>
            <textarea className='campo-textarea' name={name} id={name} placeholder={placeholder} />
        </div>
    )
}
export default CampoTextarea
