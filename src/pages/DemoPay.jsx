import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'

// Simulierte Payrexx-Zahlungsseite (nur Demo-Modus)
export default function DemoPay() {
  const { id } = useParams(); const [sp] = useSearchParams(); const nav = useNavigate()
  const [step, setStep] = useState(0)
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 900)
    const t2 = setTimeout(() => setStep(2), 2200)
    const t3 = setTimeout(() => nav(`/bestellen/status/${id}?t=${sp.get('t')}&r=ok`, { replace: true }), 3200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [id])
  return (
    <div className="min-h-screen bg-[#f4f5f7] text-[#1b1f24] grid place-items-center p-6" style={{ fontFamily: 'system-ui' }}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-6">
        <p className="text-xs text-black/50 tracking-wide">Simulierte Zahlungsseite · Payrexx</p>
        <p className="mt-3 font-semibold">FC Beizli Bestellung</p>
        <div className="mt-5 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-black text-white font-bold text-xs">TWINT</span>
          <span className="text-sm">{step === 0 ? 'Verbinde mit Twint …' : step === 1 ? 'Bitte in der Twint-App bestätigen …' : 'Zahlung bestätigt ✓'}</span>
        </div>
        <div className="mt-5 h-1.5 rounded-full bg-black/10 overflow-hidden"><div className="h-full bg-black transition-all duration-700" style={{ width: `${[15, 60, 100][step]}%` }} /></div>
        <p className="mt-6 text-xs text-black/50">Im Live-Betrieb öffnet hier die echte Payrexx-Seite mit Twint, Karte und PostFinance.</p>
      </div>
    </div>
  )
}
