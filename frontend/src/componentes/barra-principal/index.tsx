import './barra-principal-estilo.css'
export function BarraPrincipal () {
  return (
    <div className='barra-principal'>
      <div className='logo'>
        <h2>Logo do projeto</h2>
      </div>
      <div className='informações'>
        <a href="">
          <button className='botoes-barra'>Médicos</button>
        </a>
      </div>
    </div>
  )
}