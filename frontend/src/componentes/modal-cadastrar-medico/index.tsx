import './modal-cadastrar-medico-estilos.css'
import { CampoSelect } from '../campo-select'
import { CampoInput } from '../campo-input'
import { CampoTextarea } from '../campo-textarea'

interface Props {
    onFechar: () => void
}

export function ModalCadastrarMedico({ onFechar }: Props) {

    const genero = [
        { value: 'masculino', label: 'Masculino' },
        { value: 'feminino', label: 'Feminino' },
        { value: 'outro', label: 'Outro' },
    ]

    return (
        <div className='overlay' onClick={onFechar}>
            <div className='modal' onClick={(e) => e.stopPropagation()}>

                <div className='modal-header'>
                    <h2>Adicionar Médico:</h2>
                    <button className='botao-fechar' onClick={onFechar}>✕</button>
                </div>

                {/* Adicione seus campos aqui */}
                <div className='modal-corpo'>
                    <CampoInput label="Nome completo" name="nome_completo" />
                    <CampoInput label="E-mail" name="email" type="email" />
                    <CampoInput label="Idade" name="idade" type="number" />
                    <CampoSelect label="Gênero" name="genero" options={genero} />
                    <CampoInput label="CRM" name="crm" type="number" />
                    <CampoInput label="Data de nascimento" name="data_nascimento" type="date" />
                    <CampoTextarea label="Sintomas" name="sintomas" placeholder="Observações..." />
                </div>

                <div className='modal-rodape'>
                    <button className='botao-concluir'>Concluir</button>
                    <button className='botao-cancelar' onClick={onFechar}>Cancelar</button>
                </div>

            </div>
        </div>
    )
}
export default ModalCadastrarMedico