import inicialImg from '../../assets/ibrahim-boran-zsKFQs2kDpM-unsplash.jpg'
import './bloco-inicial-estilos.css'
export function BlocoInicial() {
    return (
        <div className='bloco-inicial'>
            <div className='texto'>
                <h1>Síndrome do X Frágil (SXF)</h1>
                <p>A Síndrome do X Frágil (SXF) é uma condição genética e hereditária, sendo a causa mais comum de deficiência intelectual herdada e de autismo. O desafio relacionado a essa síndrome é o diagnóstico pois os exames necessários são caros e de acesso limitado.</p>
            </div>
            <div className='imagem'>
                <img src={inicialImg} alt="Imagem ilustrativa da Síndrome do X Frágil" className='ImagemIlustrativa'/>
            </div>
        </div>
    )
}