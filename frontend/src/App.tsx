import { useState } from 'react'
import inicialImg from './assets/ibrahim-boran-zsKFQs2kDpM-unsplash.jpg'
import {BarraPrincipal} from './componentes/barra-principal'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <BarraPrincipal />
    <div className='bloco-inicial'>
      <div className='texto'>
        <h1>Síndrome do X Frágil (SXF)</h1>
        <p>A Síndrome do X Frágil (SXF) é uma condição genética e hereditária, sendo a causa mais comum de deficiência intelectual herdada e de autismo. O desafio relacionado a essa síndrome é o diagnóstico pois os exames necessários são caros e de acesso limitado.</p>
      </div>
      <div className='imagem'>
        <img src={inicialImg} alt="" />
      </div>
    </div>
    <div className='bloco-secundario'>
      <div className='titulo-sobre'>
        <h1>Sobre o projeto</h1>
      </div>
      <div className='bloco-texto'>
        <div className='blobo-primario'>
          <h3>Sobre a Síndrome do X Frágil</h3>
          <p className='texto-bloco'>aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa</p>
        </div>
        <div className='bloco-secundario'>
          <h3>Sobre o projeto</h3>
          <p className='texto-bloco'>aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa</p>
        </div>
      </div>
    </div>
      <div className='direitos-finais'>
        <div className='textinho'>
          <p>Copyright © 2026 - Todos os direitos reservados.</p>
        </div>
      </div>
      
    </>
  )
}

export default App
