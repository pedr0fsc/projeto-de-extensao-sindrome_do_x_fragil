import jsPDF from 'jspdf'

export interface DadosConsulta {
    paciente: {
        nome: string
        cpf: string
        idade: number
        genero: string
        dataNascimento: string
    }
    consulta: {
        data: string
        medico: string
        sintomas: string[]
        observacoes?: string
    }
}

export function gerarPdfConsulta(dados: DadosConsulta) {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    let y = 0

    // Header block
    doc.setFillColor(44, 105, 117)
    doc.rect(0, 0, pageWidth, 44, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Relatório de Consulta', margin, 20)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Síndrome do X Frágil — Sistema de Gestão de Pacientes', margin, 34)

    y = 58

    // --- Dados do Paciente ---
    doc.setFillColor(224, 236, 222)
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 62, 4, 4, 'F')

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(44, 105, 117)
    doc.text('Dados do Paciente', margin + 8, y + 14)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(50, 50, 50)

    const mid = pageWidth / 2
    doc.text(`Nome: ${dados.paciente.nome}`, margin + 8, y + 28)
    doc.text(`CPF: ${dados.paciente.cpf}`, mid, y + 28)
    doc.text(`Idade: ${dados.paciente.idade} anos`, margin + 8, y + 42)
    doc.text(`Gênero: ${dados.paciente.genero}`, mid, y + 42)
    doc.text(`Nascimento: ${dados.paciente.dataNascimento}`, margin + 8, y + 56)

    y += 74

    // --- Dados da Consulta ---
    doc.setFillColor(224, 236, 222)
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 40, 4, 4, 'F')

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(44, 105, 117)
    doc.text('Dados da Consulta', margin + 8, y + 14)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(50, 50, 50)
    doc.text(`Data: ${dados.consulta.data}`, margin + 8, y + 30)
    doc.text(`Médico responsável: ${dados.consulta.medico}`, mid, y + 30)

    y += 52

    // --- Sintomas ---
    if (dados.consulta.sintomas.length > 0) {
        const rows = Math.ceil(dados.consulta.sintomas.length / 2)
        const boxH = 28 + rows * 14
        doc.setFillColor(224, 236, 222)
        doc.roundedRect(margin, y, pageWidth - 2 * margin, boxH, 4, 4, 'F')

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(44, 105, 117)
        doc.text('Sintomas Observados', margin + 8, y + 14)

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(50, 50, 50)

        dados.consulta.sintomas.forEach((s, i) => {
            const col = i % 2 === 0 ? margin + 8 : mid
            const row = y + 26 + Math.floor(i / 2) * 14
            doc.text(`• ${s}`, col, row)
        })

        y += boxH + 12
    } else {
        doc.setFillColor(224, 236, 222)
        doc.roundedRect(margin, y, pageWidth - 2 * margin, 36, 4, 4, 'F')
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(44, 105, 117)
        doc.text('Sintomas Observados', margin + 8, y + 14)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(50, 50, 50)
        doc.text('Nenhum sintoma registrado nesta consulta.', margin + 8, y + 28)
        y += 48
    }

    // --- Observações ---
    if (dados.consulta.observacoes) {
        const obsLines = doc.splitTextToSize(dados.consulta.observacoes, pageWidth - 2 * margin - 16)
        const obsH = 26 + obsLines.length * 12
        doc.setFillColor(224, 236, 222)
        doc.roundedRect(margin, y, pageWidth - 2 * margin, obsH, 4, 4, 'F')

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(44, 105, 117)
        doc.text('Observações', margin + 8, y + 14)

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(50, 50, 50)
        doc.text(obsLines, margin + 8, y + 26)

        y += obsH + 12
    }

    // Footer
    doc.setDrawColor(44, 105, 117)
    doc.setLineWidth(0.5)
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
        `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} — Documento de uso interno e confidencial`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
    )

    const nomeArquivo = `consulta_${dados.paciente.nome.replace(/\s+/g, '_')}_${dados.consulta.data.replace(/\//g, '-')}.pdf`
    doc.save(nomeArquivo)
}
