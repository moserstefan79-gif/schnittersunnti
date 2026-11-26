// Eigenes Maskottchen für den Junioren-Aufruf: Junior mit Cap und Nummer 12 im Schuss, Haar in Orange wie im Home-of-Football-Logo
export default function JuniorMascot({ className = '' }) {
  const ink = '#0E1114', orange = '#FF7000', deep = '#D45A00', skin = '#F6D7B0', paper = '#fff'
  return (
    <svg viewBox="0 0 150 140" className={className} aria-hidden="true">
      <defs>
        <clipPath id="jm-head"><circle cx="60" cy="36" r="18" /></clipPath>
      </defs>
      {/* Bodenschatten */}
      <ellipse cx="78" cy="131" rx="40" ry="5" fill={ink} opacity=".12" />

      {/* Ball mit Bewegungslinien */}
      <g className="jm-ball">
        <circle cx="128" cy="86" r="14" fill={paper} stroke={ink} strokeWidth="3" />
        <path d="M128 75.5l7.6 5.5-2.9 9h-9.4l-2.9-9z" fill={ink} />
        <path d="M128 75.5v-3.5M135.6 81l3.4-1.6M132.7 90l2.4 3.2M123.3 90l-2.4 3.2M120.4 81l-3.4-1.6" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <path d="M108 112h12M104 120h8" stroke={ink} strokeWidth="2.5" strokeLinecap="round" opacity=".35" />

      {/* Hinteres Bein (Standbein) */}
      <path d="M58 92l-6 26" stroke={ink} strokeWidth="11" strokeLinecap="round" />
      <path d="M40 122h20" stroke={orange} strokeWidth="9" strokeLinecap="round" />
      <path d="M40 122h20" stroke={ink} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity=".0" />

      {/* Rumpf / Trikot */}
      <path d="M46 60c4-6 24-6 28 0l4 32c-10 5-26 5-36 0z" fill={paper} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M48 62l-8 6 4 7 5-4z" fill={orange} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M72 62l8 6-4 7-5-4z" fill={orange} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M54 60c3 3 9 3 12 0" stroke={ink} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <text x="60" y="84" textAnchor="middle" fontFamily="Bricolage Grotesque, Figtree, sans-serif" fontWeight="800" fontSize="17" fill={orange} stroke={ink} strokeWidth=".6">12</text>

      {/* Schussbein (vorne) */}
      <path d="M68 92l18 10 18-14" stroke={ink} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M98 92l14-10" stroke={orange} strokeWidth="9" strokeLinecap="round" />

      {/* Arme */}
      <path d="M46 66L26 52" stroke={ink} strokeWidth="9" strokeLinecap="round" />
      <circle cx="24" cy="50" r="5.5" fill={skin} stroke={ink} strokeWidth="2.5" />
      <path d="M74 66l18 10" stroke={ink} strokeWidth="9" strokeLinecap="round" />
      <circle cx="94" cy="78" r="5.5" fill={skin} stroke={ink} strokeWidth="2.5" />

      {/* Haar (Orange, wie die Flamme im Logo) */}
      <path d="M44 34c-6-2-8-10-4-16 2 4 6 5 8 3-1 5 1 9 4 11z" fill={orange} stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M40 44c-6 0-9-6-7-11 3 3 7 3 9 1-1 4 0 8 3 10z" fill={deep} stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />

      {/* Kopf */}
      <circle cx="60" cy="36" r="18" fill={skin} stroke={ink} strokeWidth="3" />
      <g clipPath="url(#jm-head)">
        <circle cx="58" cy="36" r="2.6" fill={ink} />
        <circle cx="70" cy="36" r="2.6" fill={ink} />
        <circle cx="59" cy="35" r=".9" fill={paper} />
        <circle cx="71" cy="35" r=".9" fill={paper} />
        <path d="M58 44c4 5 10 5 14 0" stroke={ink} strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="54" cy="42" r="2.5" fill={orange} opacity=".35" />
        <circle cx="75" cy="42" r="2.5" fill={orange} opacity=".35" />
      </g>

      {/* Cap nach vorne */}
      <path d="M42 30c2-11 10-16 19-16s17 5 19 16z" fill={orange} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M44 30h36l-2 4H46z" fill={deep} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M78 30c8-2 16 0 20 4l-4 4c-4-2-10-3-16-2z" fill={orange} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="61" cy="14" r="2.6" fill={ink} />
      <circle cx="62" cy="23" r="3.2" fill={paper} stroke={ink} strokeWidth="1.5" />
      <path d="M62 20.5l1.4 1-.5 1.7h-1.8l-.5-1.7z" fill={ink} />
    </svg>
  )
}
