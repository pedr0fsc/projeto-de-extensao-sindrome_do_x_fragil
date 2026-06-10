import { useState } from 'react'

interface Props {
    onFechar: () => void
}

export function ModalCadastrarInstituicao({ onFechar }: Props) {
    const [form, setForm] = useState({
        nome_fantasia: '',
        nome: '',
        cnpj: '',
        rua: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',
    })
    const [erro, setErro] = useState('')
    const [salvando, setSalvando] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async () => {
        if (!form.nome_fantasia || !form.cnpj || !form.rua || !form.numero || !form.bairro || !form.cidade || !form.estado || !form.cep) {
            setErro('Preencha todos os campos obrigatórios.')
            return
        }
        setSalvando(true)
        setErro('')
        try {
            const res = await fetch('/api/instituicao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const data = await res.json()
            if (data.success) {
                onFechar()
            } else {
                setErro('Erro ao cadastrar instituição.')
            }
        } catch {
            setErro('Erro de conexão.')
        } finally {
            setSalvando(false)
        }
    }

    return (
        <div className='modal-overlay' onClick={onFechar}>
            <div className='modal-caixa' onClick={e => e.stopPropagation()}>
                <h2 className='modal-titulo'>Cadastrar Instituição</h2>

                <div className='modal-campo'>
                    <label>Nome Fantasia *</label>
                    <input name='nome_fantasia' value={form.nome_fantasia} onChange={handleChange} placeholder='Nome Fantasia' />
                </div>
                <div className='modal-campo'>
                    <label>Razão Social</label>
                    <input name='nome' value={form.nome} onChange={handleChange} placeholder='Razão Social (opcional)' />
                </div>
                <div className='modal-campo'>
                    <label>CNPJ *</label>
                    <input name='cnpj' value={form.cnpj} onChange={handleChange} placeholder='00.000.000/0001-00' />
                </div>
                <div className='modal-campo'>
                    <label>CEP *</label>
                    <input name='cep' value={form.cep} onChange={handleChange} placeholder='00000-000' />
                </div>
                <div className='modal-campo'>
                    <label>Rua *</label>
                    <input name='rua' value={form.rua} onChange={handleChange} placeholder='Rua' />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div className='modal-campo' style={{ flex: 1 }}>
                        <label>Número *</label>
                        <input name='numero' value={form.numero} onChange={handleChange} placeholder='Nº' />
                    </div>
                    <div className='modal-campo' style={{ flex: 2 }}>
                        <label>Complemento</label>
                        <input name='complemento' value={form.complemento} onChange={handleChange} placeholder='Apto, sala...' />
                    </div>
                </div>
                <div className='modal-campo'>
                    <label>Bairro *</label>
                    <input name='bairro' value={form.bairro} onChange={handleChange} placeholder='Bairro' />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div className='modal-campo' style={{ flex: 3 }}>
                        <label>Cidade *</label>
                        <input name='cidade' value={form.cidade} onChange={handleChange} placeholder='Cidade' />
                    </div>
                    <div className='modal-campo' style={{ flex: 1 }}>
                        <label>Estado *</label>
                        <input name='estado' value={form.estado} onChange={handleChange} placeholder='PR' maxLength={2} />
                    </div>
                </div>

                {erro && <p className='modal-erro'>{erro}</p>}

                <div className='modal-botoes'>
                    <button className='btn-cancelar' onClick={onFechar}>Cancelar</button>
                    <button className='btn-salvar' onClick={handleSubmit} disabled={salvando}>
                        {salvando ? 'Salvando...' : 'Cadastrar'}
                    </button>
                </div>
            </div>
        </div>
    )
}