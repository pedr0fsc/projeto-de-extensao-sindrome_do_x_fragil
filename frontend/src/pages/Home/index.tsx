import { BlocoInicial } from '../../componentes/bloco-inicial'
import {BarraPrincipal} from '../../componentes/barra-principal'
import { BlocoSecundario } from '../../componentes/bloco-secundario'
import { Footer } from '../../componentes/footer'
import { CardSintomas } from '../../componentes/card-sintomas'
function Home() {
    return (
        <>
            <BarraPrincipal />
            <BlocoInicial />
            <BlocoSecundario />
            <CardSintomas />
            <Footer />

        </>
    )
}
export default Home