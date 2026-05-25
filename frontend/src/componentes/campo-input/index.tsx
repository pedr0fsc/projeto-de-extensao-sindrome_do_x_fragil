import './campo-input-estilos.css'

interface Props {
    label: string
    name: string
    type?: string
    placeholder?: string
}

export function CampoInput({ label, name, type = 'text', placeholder = '' }: Props) {
    return (
        <div className='campo-input-wrapper'>
            <label className='campo-label' htmlFor={name}>{label}</label>
            <input className='campo-input' type={type} name={name} id={name} placeholder={placeholder} />
        </div>
    )
}
export default CampoInput
