import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from '../src/pages/home'
import LoginMedicos from '../src/pages/login-medicos'
import PaginaMedicos from '../src/pages/medicos'
import PaginaAdministrador from '../src/pages/administrador'
import NaoEncontrado from '../src/pages/nao-encontrado'
import PaginaResetSenha from '../src/pages/recuperar-senha'
import { AlertaProvider } from '../src/components/alerta'

import './App.css'

function App() {
  return (
    <AlertaProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sobre" element={<Home />} />
        <Route path="/login-medicos" element={<LoginMedicos />} />
        <Route path="/medicos" element={<PaginaMedicos />} />
        <Route path="/administrador" element={<PaginaAdministrador />} />
        <Route path="/recuperar-senha" element={<PaginaResetSenha />} />
        <Route path="*" element={<NaoEncontrado />} />
      </Routes>
    </BrowserRouter>
    </AlertaProvider>
  )
}

export default App
