interface Props {
  label: string
  name: string
  type?: string
  placeholder?: string
}

export function CampoInput({ label, name, type = 'text', placeholder = '' }: Props) {
  return (
    <div>
      <label>{label}</label>
      <input type={type} name={name} id={name} placeholder={placeholder} />
    </div>
  )
}
export default CampoInput