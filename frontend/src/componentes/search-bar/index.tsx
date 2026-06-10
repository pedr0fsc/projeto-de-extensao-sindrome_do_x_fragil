import './search-bar-estilos.css'
import lupaImg from '../../assets/lupa.png'
import { useState, useEffect } from 'react'

interface SearchBarProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    debounceMs?: number
}

export function SearchBar({ value, onChange, placeholder = 'Pesquisar', debounceMs = 200 }: SearchBarProps) {
    const [localValue, setLocalValue] = useState(value)

    // Keep local value in sync if parent resets it
    useEffect(() => {
        setLocalValue(value)
    }, [value])

    // Debounce: only propagate to parent after the user stops typing
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localValue !== value) {
                onChange(localValue)
            }
        }, debounceMs)
        return () => clearTimeout(timer)
    }, [localValue])

    return (
        <div className='admin-search'>
            <img src={lupaImg} alt="Pesquisar" />
            <input
                type="text"
                placeholder={placeholder}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
            />
            {localValue && (
                <button
                    className='search-clear'
                    onClick={() => { setLocalValue(''); onChange('') }}
                    aria-label="Limpar pesquisa"
                >
                    ×
                </button>
            )}
        </div>
    )
}

export default SearchBar