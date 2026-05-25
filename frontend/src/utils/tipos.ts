export interface Paciente {
    cpf: string
    nome: string
    idade: number
    genero: string
    dataNascimento: string
    ultimaConsulta: string
    sintomas: string[]
    observacoes: string
    medico: string
}

export interface ConsultaHistorico {
    id: number
    data: string
    medico: string
    motivo: string
}

export interface Prontuario {
    pacienteCpf: string
    data: string
    queixaPrincipal: string
    diagnostico: string
    prescricao: string
    observacoes: string
    medico: string
}
