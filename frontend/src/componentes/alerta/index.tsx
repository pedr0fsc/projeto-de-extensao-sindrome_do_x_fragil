import { createContext, useContext, useState, useCallback, useRef } from 'react'
import './alerta-estilos.css'

type TipoAlerta = 'sucesso' | 'erro' | 'info'

interface AlertaItem {
    id: number
    mensagem: string
    tipo: TipoAlerta
    saindo: boolean
}

interface AlertaContexto {
    mostrarAlerta: (mensagem: string, tipo?: TipoAlerta) => void
}

const AlertaContext = createContext<AlertaContexto | null>(null)

export function AlertaProvider({ children }: { children: React.ReactNode }) {
    const [alertas, setAlertas] = useState<AlertaItem[]>([])
    const contadorRef = useRef(0)

    const mostrarAlerta = useCallback((mensagem: string, tipo: TipoAlerta = 'info') => {
        const id = ++contadorRef.current
        setAlertas(prev => [...prev, { id, mensagem, tipo, saindo: false }])

        setTimeout(() => {
            setAlertas(prev => prev.map(a => a.id === id ? { ...a, saindo: true } : a))
        }, 3800)

        setTimeout(() => {
            setAlertas(prev => prev.filter(a => a.id !== id))
        }, 4300)
    }, [])

    const fecharAlerta = (id: number) => {
        setAlertas(prev => prev.map(a => a.id === id ? { ...a, saindo: true } : a))
        setTimeout(() => {
            setAlertas(prev => prev.filter(a => a.id !== id))
        }, 400)
    }

    const icones: Record<TipoAlerta, string> = {
        sucesso: '✓',
        erro: '✕',
        info: 'ℹ',
    }

    return (
        <AlertaContext.Provider value={{ mostrarAlerta }}>
            {children}
            <div className='alerta-container' role='region' aria-live='polite'>
                {alertas.map(alerta => (
                    <div
                        key={alerta.id}
                        className={`alerta alerta-${alerta.tipo}${alerta.saindo ? ' alerta-saindo' : ''}`}
                        role='alert'
                    >
                        <span className='alerta-icone'>{icones[alerta.tipo]}</span>
                        <span className='alerta-mensagem'>{alerta.mensagem}</span>
                        <button
                            className='alerta-fechar'
                            onClick={() => fecharAlerta(alerta.id)}
                            aria-label='Fechar notificação'
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </AlertaContext.Provider>
    )
}

export function useAlerta() {
    const ctx = useContext(AlertaContext)
    if (!ctx) throw new Error('useAlerta deve ser usado dentro de AlertaProvider')
    return ctx
}
