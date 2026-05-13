import { BlocoInicial } from '../../componentes/bloco-inicial'
import {BarraPrincipal} from '../../componentes/barra-principal'
import { Footer } from '../../componentes/footer'
function Home() {
    return (
        <>
            <BarraPrincipal />
            <BlocoInicial />
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
            <Footer />

        </>
    )
}
export default Home