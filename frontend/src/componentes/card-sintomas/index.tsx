import './card-sintomas-estilos.css'

const sintomas = [
    { titulo: 'Deficiência Intelectual', descricao: 'Comprometimento cognitivo com graus variáveis de intensidade, afetando aprendizado e memória.' },
    { titulo: 'Face Alongada', descricao: 'Características faciais distintas incluindo face alongada, fronte proeminente e orelhas grandes.' },
    { titulo: 'Macroorquidismo', descricao: 'Aumento testicular observado na maioria dos homens adultos portadores da síndrome.' },
    { titulo: 'Hipermobilidade articular', descricao: 'Flexibilidade excessiva das articulações, especialmente nos dedos das mãos.' },
    { titulo: 'Comportamento Autista', descricao: 'Dificuldades nas interações sociais, contato visual reduzido e padrões repetitivos.' },
    { titulo: 'Hiperatividade', descricao: 'Déficit de atenção e impulsividade são comuns, especialmente em crianças.' },
    { titulo: 'Epilepsia', descricao: 'Ocorrência de convulsões em parte dos portadores, geralmente controlável com medicação.' },
    { titulo: 'Ansiedade', descricao: 'Transtornos de ansiedade frequentes, especialmente em situações sociais novas.' },
    { titulo: 'Problemas Sensoriais', descricao: 'Hipersensibilidade a sons, texturas e estímulos visuais do ambiente.' },
    { titulo: 'Atraso na Fala', descricao: 'Desenvolvimento tardio da linguagem e dificuldades de articulação e comunicação.' },
    { titulo: 'Hipotonia Muscular', descricao: 'Tônus muscular reduzido ao nascimento, afetando coordenação motora fina e grossa.' },
    { titulo: 'Orelhas Proeminentes', descricao: 'Orelhas grandes e projetadas para frente, uma das características físicas mais frequentes.' },
]

export function CardSintomas() {
    return (
        <div className='bloco-sintomas-principal'>
            <div className='titulo-sintomas'>
                <h1>Sintomas</h1>
            </div>
            <div className='grid-sintomas'>
                {sintomas.map((s, i) => (
                    <div key={i} className='card-sintoma'>
                        <h3>{s.titulo}</h3>
                        <p>{s.descricao}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
