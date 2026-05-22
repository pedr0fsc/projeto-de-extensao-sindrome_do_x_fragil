interface Props {
  label: string
  name: string
  options?: { value: string; label: string }[]
}

export function CampoSelect({ label, name, options = [] }: Props) {
  return (
    <div>
      <label>{label}</label>
      <select name={name} id={name}>
        <option value="">Selecione</option>
        {options.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
    </div>
  )
}
export default CampoSelect