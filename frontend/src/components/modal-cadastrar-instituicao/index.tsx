import { useState } from 'react'
import './modal-cadastrar-instituicao-estilos.css'
import { useAlerta } from '../alerta'
import { formatarCNPJ, validarCNPJ } from '../../utils/mascaras'

interface Props {
    onFechar: () => void
}

export function ModalCadastrarInstituicao({ onFechar }: Props) {
    const [nomeFantasia, setNomeFantasia] = useState('')
    const [nome, setNome] = useState('')
    const [cnpj, setCnpj] = useState('')
    const [cep, setCep] = useState('')
    const [rua, setRua] = useState('')
    const [numero, setNumero] = useState('')
    const [complemento, setComplemento] = useState('')
    const [bairro, setBairro] = useState('')
    const [cidade, setCidade] = useState('')
    const [estado, setEstado] = useState('')
    const [loading, setLoading] = useState(false)
    const [tentouSubmit, setTentouSubmit] = useState(false)
    const { mostrarAlerta } = useAlerta()

    const erros = {
        nomeFantasia: !nomeFantasia.trim(),
        cnpj: !validarCNPJ(cnpj),
        cep: !cep.trim(),
        numero: !numero.trim(),
        rua: !rua.trim(),
        bairro: !bairro.trim(),
        cidade: !cidade.trim(),
        estado: !estado.trim(),
    }

    const handleConcluir = async () => {
        setTentouSubmit(true)
        if (Object.values(erros).some(Boolean)) return
        setLoading(true)
        try {
            const response = await fetch('/api/instituicao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome_fantasia: nomeFantasia, nome, cnpj, rua, numero, complemento, bairro, cidade, estado, cep })
            })
            const data = await response.json()
            if (data.success) {
                mostrarAlerta('Instituição cadastrada com sucesso!', 'sucesso')
                onFechar()
            } else {
                mostrarAlerta('Erro ao cadastrar instituição.', 'erro')
            }
        } catch (err) {
            console.error(err)
            mostrarAlerta('Erro de conexão', 'erro')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='overlay' onClick={onFechar}>
            <div className='modal' onClick={e => e.stopPropagation()}>

                <div className='modal-header'>
                    <h2>Adicionar Instituição:</h2>
                    <button className='botao-fechar' onClick={onFechar}>✕</button>
                </div>

                <div className='modal-corpo'>
                    <div className='form-campo'>
                        <label>Nome Fantasia *</label>
                        <input type='text' value={nomeFantasia} onChange={e => setNomeFantasia(e.target.value)} placeholder='Nome Fantasia' className={tentouSubmit && erros.nomeFantasia ? 'input-erro' : ''} />
                        {tentouSubmit && erros.nomeFantasia && <p className='campo-erro-msg'>Nome Fantasia é obrigatório</p>}
                    </div>
                    <div className='form-campo'>
                        <label>Razão Social</label>
                        <input type='text' value={nome} onChange={e => setNome(e.target.value)} placeholder='Razão Social (opcional)' />
                    </div>
                    <div className='form-campo'>
                        <label>CNPJ *</label>
                        <input type='text' value={cnpj} onChange={e => setCnpj(formatarCNPJ(e.target.value))} placeholder='00.000.000/0001-00' maxLength={18} className={tentouSubmit && erros.cnpj ? 'input-erro' : ''} />
                        {tentouSubmit && erros.cnpj && <p className='campo-erro-msg'>CNPJ inválido</p>}
                    </div>
                    <div className='form-linha'>
                        <div className='form-campo'>
                            <label>CEP *</label>
                            <input type='text' value={cep} onChange={e => setCep(e.target.value)} placeholder='00000-000' maxLength={9} className={tentouSubmit && erros.cep ? 'input-erro' : ''} />
                            {tentouSubmit && erros.cep && <p className='campo-erro-msg'>CEP é obrigatório</p>}
                        </div>
                        <div className='form-campo form-campo-pequeno'>
                            <label>Número *</label>
                            <input type='text' value={numero} onChange={e => setNumero(e.target.value)} placeholder='Nº' maxLength={4} className={tentouSubmit && erros.numero ? 'input-erro' : ''} />
                            {tentouSubmit && erros.numero && <p className='campo-erro-msg'>Obrigatório</p>}
                        </div>
                    </div>
                    <div className='form-campo'>
                        <label>Rua *</label>
                        <input type='text' value={rua} onChange={e => setRua(e.target.value)} placeholder='Rua' className={tentouSubmit && erros.rua ? 'input-erro' : ''} />
                        {tentouSubmit && erros.rua && <p className='campo-erro-msg'>Rua é obrigatória</p>}
                    </div>
                    <div className='form-campo'>
                        <label>Complemento</label>
                        <input type='text' value={complemento} onChange={e => setComplemento(e.target.value)} placeholder='Apto, sala... (opcional)' />
                    </div>
                    <div className='form-campo'>
                        <label>Bairro *</label>
                        <input type='text' value={bairro} onChange={e => setBairro(e.target.value)} placeholder='Bairro' className={tentouSubmit && erros.bairro ? 'input-erro' : ''} />
                        {tentouSubmit && erros.bairro && <p className='campo-erro-msg'>Bairro é obrigatório</p>}
                    </div>
                    <div className='form-linha'>
                        <div className='form-campo'>
                            <label>Cidade *</label>
                            <input type='text' value={cidade} onChange={e => setCidade(e.target.value)} placeholder='Cidade' className={tentouSubmit && erros.cidade ? 'input-erro' : ''} />
                            {tentouSubmit && erros.cidade && <p className='campo-erro-msg'>Cidade é obrigatória</p>}
                        </div>
                        <div className='form-campo form-campo-estado'>
                            <label>UF *</label>
                            <input type='text' value={estado} onChange={e => setEstado(e.target.value.toUpperCase())} placeholder='PR' maxLength={2} className={tentouSubmit && erros.estado ? 'input-erro' : ''} />
                            {tentouSubmit && erros.estado && <p className='campo-erro-msg'>UF obrigatória</p>}
                        </div>
                    </div>
                </div>

                <div className='modal-rodape'>
                    <button className='botao-concluir' onClick={handleConcluir} disabled={loading}>
                        {loading ? 'Salvando...' : 'Concluir'}
                    </button>
                    <button className='botao-cancelar' onClick={onFechar}>Cancelar</button>
                </div>

            </div>
        </div>
    )
}

export default ModalCadastrarInstituicao