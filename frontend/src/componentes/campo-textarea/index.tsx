interface Props {
  label: string
  name: string
  placeholder?: string
}

export function CampoTextarea({ label, name, placeholder = '' }: Props) {
  return (
    <div>
      <label>{label}</label>
      <textarea name={name} id={name} placeholder={placeholder} />
    </div>
  )
}
export default CampoTextarea