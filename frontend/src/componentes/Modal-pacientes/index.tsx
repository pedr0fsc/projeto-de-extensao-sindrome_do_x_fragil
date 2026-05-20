import './modal-pacientes-estilos.css'
import { CampoSelect } from '../campo-select'
import { CampoInput } from '../campo-input'
import { CampoTextarea } from '../campo-textarea'

interface Props {
    onFechar: () => void
}

export function ModalCadastrarPaciente({ onFechar }: Props) {
    const simNao = [
        { value: 'sim', label: 'Sim' },
        { value: 'nao', label: 'Não' },
    ]

    const sintomas = [
        { label: 'Deficiência intelectual', name: 'deficiencia_intelectual' },
        { label: 'Face alongada/orelha', name: 'face_alongada_orelha' },
        { label: 'Macroorquidismo', name: 'macroorquidismo' },
        { label: 'Hipermobilidade articular', name: 'hipermobilidade_articular' },
        { label: 'Dificuldades de aprendizagem', name: 'dificuldades_aprendizagem' },
        { label: 'Déficit de atenção', name: 'deficit_atencao' },
        { label: 'Mov. repetitivo', name: 'movimento_repetitivo' },
        { label: 'Atraso na fala', name: 'atraso_fala' },
        { label: 'Hiperatividade', name: 'hiperatividade' },
        { label: 'Evita contato visual', name: 'evita_contato_visual' },
        { label: 'Evita contato físico', name: 'evita_contato_fisico' },
        { label: 'Agressividade', name: 'agressividade' },
    ]

    const genero = [
        { value: 'masculino', label: 'Masculino' },
        { value: 'feminino', label: 'Feminino' },
        { value: 'outro', label: 'Outro' },
    ]

    const acompanhante = [
        { value: 'mae', label: 'Mãe' },
        { value: 'pai', label: 'Pai' },
        { value: 'outro', label: 'Outro' },
    ]
    return (
        <div className='overlay' onClick={onFechar}>
            <div className='modal' onClick={(e) => e.stopPropagation()}>

                <div className='modal-header'>
                    <h2>Adicionar Paciente:</h2>
                    <button className='botao-fechar' onClick={onFechar}>✕</button>
                </div>

                {/* Adicione seus campos aqui */}
                <div className='modal-corpo'>
                    <CampoInput label="Nome completo" name="nome_completo" />
                    <CampoInput label="E-mail" name="email" type="email" />
                    <CampoInput label="Idade" name="idade" type="number" />
                    <CampoSelect label="Gênero" name="genero" options={genero} />
                    <CampoSelect label="Acompanhante" name="acompanhante" options={acompanhante} />
                    <CampoInput label="Nome do acompanhante" name="nome_acompanhante" />
                    <CampoInput label="Data de nascimento" name="data_nascimento" type="date" />
                    <CampoTextarea label="Sintomas" name="sintomas" placeholder="Observações..." />
                    {sintomas.map((sintoma) => (
                        <CampoSelect
                            key={sintoma.name}
                            label={sintoma.label}
                            name={sintoma.name}
                            options={simNao}
                        />
                    ))}
                </div>

                <div className='modal-rodape'>
                    <button className='botao-concluir'>Concluir</button>
                    <button className='botao-cancelar' onClick={onFechar}>Cancelar</button>
                </div>

            </div>
        </div>
    )
}