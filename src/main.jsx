import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom'
import { DEMO } from './lib/supabase.js'
import DemoPay from './pages/DemoPay.jsx'
import DemoBar from './components/DemoBar.jsx'
import './index.css'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Helfer from './pages/Helfer.jsx'
import Admin from './pages/Admin.jsx'
import Rueckblick from './pages/Rueckblick.jsx'
import Bestellen from './pages/Bestellen.jsx'
import BestellStatus from './pages/BestellStatus.jsx'
import Station from './pages/Station.jsx'
import { AuthProvider } from './components/AuthProvider.jsx'

const Router = DEMO ? HashRouter : BrowserRouter

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        {DEMO && <DemoBar />}
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/helfer" element={<Helfer />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/rueckblick-2026" element={<Rueckblick />} />
          </Route>
          {/* Gast-Bestellung und Betriebs-Screens ohne Website-Rahmen */}
          <Route path="/bestellen" element={<Bestellen />} />
          <Route path="/bestellen/status/:id" element={<BestellStatus />} />
          <Route path="/bestellen/:code" element={<Bestellen />} />
          <Route path="/station/:station" element={<Station />} />
          <Route path="/demo-pay/:id" element={<DemoPay />} />
        </Routes>
      </AuthProvider>
    </Router>
  </React.StrictMode>,
)
