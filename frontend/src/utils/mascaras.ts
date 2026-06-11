export const formatarCPF = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, '')
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
