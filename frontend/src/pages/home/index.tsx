import { BlocoInicial } from '../../components/bloco-inicial'
import {BarraPrincipal} from '../../components/barra-principal'
import { BlocoSecundario } from '../../components/bloco-secundario'
import { Footer } from '../../components/footer'
import { CardSintomas } from '../../components/card-sintomas'
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
