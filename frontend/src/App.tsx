import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from '../src/pages/Home'
import LoginMedicos from '../src/pages/Login Médicos'
import PaginaMedicos from '../src/pages/Médicos'
import PaginaAdministrador from '../src/pages/Administrador'
import NaoEncontrado from '../src/pages/NaoEncontrado'

import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sobre" element={<Home />} />
        <Route path="/login-medicos" element={<LoginMedicos />} />
        <Route path="/pagina-medicos" element={<PaginaMedicos />} />
        <Route path="/pagina-administrador" element={<PaginaAdministrador />} />
        <Route path="*" element={<NaoEncontrado />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
