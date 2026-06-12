export const formatarCPF = (valor: string | undefined | null) => {
    if (!valor) return ''
    const apenasNumeros = valor.toString().replace(/\D/g, '')
    return apenasNumeros
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1')
}

export const formatarTelefone = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, '')
    return apenasNumeros
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1')
}

export const limparFormatacao = (valor: string) => {
    return valor.replace(/\D/g, '')
}

export const formatarCRM = (valor: string) => {
    const limpo = valor.replace(/[^0-9a-zA-Z\/]/g, '')
    const partes = limpo.split('/')
    const numero = partes[0].replace(/\D/g, '').slice(0, 6)
    if (partes.length > 1) {
        const uf = partes[1].replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2)
        return numero + '/' + uf
    }
    return numero
}

export const formatarCNPJ = (valor: string) => {
    const numeros = valor.replace(/\D/g, '').slice(0, 14)
    return numeros
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1')
}

export const validarCNPJ = (cnpj: string) => {
    const n = cnpj.replace(/\D/g, '')
    if (n.length !== 14) return false
    if (/^(\d)\1+$/.test(n)) return false
    const calc = (base: string, pesos: number[]) => {
        const soma = base.split('').reduce((acc, d, i) => acc + parseInt(d) * pesos[i], 0)
        const resto = soma % 11
        return resto < 2 ? 0 : 11 - resto
    }
    const d1 = calc(n.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
    const d2 = calc(n.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
    return parseInt(n[12]) === d1 && parseInt(n[13]) === d2
}

export const validarEmail = (email: string) => {
    return email.trim().length > 0 && email.includes('@')
}
