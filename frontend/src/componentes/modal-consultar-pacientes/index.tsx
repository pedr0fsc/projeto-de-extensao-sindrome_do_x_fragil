import { useState } from 'react'

interface Props {
  onFechar: () => void
}

export function ModalConsultarPacientes({ onFechar }: Props) {
  const [cpf, setCpf] = useState('')
  const [resultado, setResultado] = useState<typeof pacientesMock[0] | null | 'não encontrado'>()

  const buscarPaciente = () => {
    const paciente = pacientesMock.find((p) => p.cpf === cpf)
    setResultado(paciente ?? 'não encontrado')
  }

  return (
    <div className='overlay' onClick={onFechar}>
      <div className='modal' onClick={(e) => e.stopPropagation()}>

        <div className='modal-header'>
          <h2>Consultar Paciente</h2>
          <button className='botao-fechar' onClick={onFechar}>✕</button>
        </div>

        <div className='modal-corpo'>
          <label>CPF do paciente</label>
          <input
            type="text"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
          />
          <button onClick={buscarPaciente}>Buscar</button>
        </div>

        {/* Paciente encontrado */}
        {resultado && resultado !== 'não encontrado' && (
          <div className='resultado-encontrado'>
            <p><strong>Nome:</strong> {resultado.nome}</p>
            <p><strong>Idade:</strong> {resultado.idade} anos</p>
            <p><strong>Gênero:</strong> {resultado.genero}</p>
            <p><strong>Nascimento:</strong> {resultado.dataNascimento}</p>
            <p><strong>Última consulta:</strong> {resultado.ultimaConsulta}</p>
          </div>
        )}

        {/* Paciente não encontrado */}
        {resultado === 'não encontrado' && (
          <div className='resultado-nao-encontrado'>
            <p>Nenhum paciente encontrado com esse CPF.</p>
            <button>+ Cadastrar novo paciente</button>
          </div>
        )}

      </div>
    </div>
  )
}