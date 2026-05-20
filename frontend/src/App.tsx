import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Home from '../src/pages/Home'
import LoginMedicos from '../src/pages/Login Médicos'
import PaginaMedicos from '../src/pages/Médicos'

import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sobre" element={<Home />} />
        <Route path="/login-medicos" element={<LoginMedicos />} />
        <Route path="/pagina-medicos" element={<PaginaMedicos />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
