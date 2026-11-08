import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Helfer from './pages/Helfer.jsx'
import Admin from './pages/Admin.jsx'
import Bestellen from './pages/Bestellen.jsx'
import BestellStatus from './pages/BestellStatus.jsx'
import Station from './pages/Station.jsx'
import Tafel from './pages/Tafel.jsx'
import { AuthProvider } from './components/AuthProvider.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/helfer" element={<Helfer />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
          {/* Gast-Bestellung und Betriebs-Screens ohne Website-Rahmen */}
          <Route path="/bestellen" element={<Bestellen />} />
          <Route path="/bestellen/status/:id" element={<BestellStatus />} />
          <Route path="/bestellen/:code" element={<Bestellen />} />
          <Route path="/station/:station" element={<Station />} />
          <Route path="/tafel" element={<Tafel />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
