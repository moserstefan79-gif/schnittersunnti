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
        <circle cx="133" cy="78" r="14" fill={paper} stroke={ink} strokeWidth="3" />
        <path d="M133 67.5l7.6 5.5-2.9 9h-9.4l-2.9-9z" fill={ink} />
        <path d="M133 67.5v-3.5M140.6 73l3.4-1.6M137.7 82l2.4 3.2M128.3 82l-2.4 3.2M125.4 73l-3.4-1.6" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <path d="M112 104h12M108 112h8" stroke={ink} strokeWidth="2.5" strokeLinecap="round" opacity=".35" />

      {/* Standbein: Haut mit Kontur, Stulpen, Schuh */}
      <path d="M54 94l-5 24" stroke={ink} strokeWidth="13" strokeLinecap="round" />
      <path d="M54 94l-5 24" stroke={skin} strokeWidth="8" strokeLinecap="round" />
      <path d="M50.5 110l-1.5 8" stroke={ink} strokeWidth="13" strokeLinecap="round" />
      <path d="M50.5 110l-1.5 8" stroke={paper} strokeWidth="8" strokeLinecap="round" />
      <path d="M51 109.5l-.6 3" stroke={orange} strokeWidth="8" strokeLinecap="butt" />
      <g transform="translate(43 119)">
        <path d="M-1 -1h15c3.5 0 6 2.5 6 6v2c0 1.5-1 2.5-2.5 2.5H-4c-3 0-5-2-5-5s2-5.5 5-5.5z" fill={orange} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
        <path d="M-7 7.5h26" stroke={paper} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M3 1l2 4M8 0l2 4" stroke={ink} strokeWidth="1.8" strokeLinecap="round" />
      </g>

      {/* Rumpf / Trikot */}
      <path d="M46 60c4-6 24-6 28 0l4 32c-10 5-26 5-36 0z" fill={paper} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M48 62l-8 6 4 7 5-4z" fill={orange} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M72 62l8 6-4 7-5-4z" fill={orange} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M54 60c3 3 9 3 12 0" stroke={ink} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <text x="60" y="84" textAnchor="middle" fontFamily="Bricolage Grotesque, Figtree, sans-serif" fontWeight="800" fontSize="17" fill={orange} stroke={ink} strokeWidth=".6">12</text>

      {/* Shorts */}
      <path d="M44 90h32l3 12H63l-3-5-3 5H42z" fill={ink} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M48 93l-2 8M72 93l2 8" stroke={orange} strokeWidth="2" strokeLinecap="round" />

      {/* Schussbein: Oberschenkel, Knie, Unterschenkel, Stulpen, Schuh Richtung Ball */}
      <path d="M70 98l18 8 16-14" stroke={ink} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M70 98l18 8 16-14" stroke={skin} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M97 98l7-6" stroke={ink} strokeWidth="14" strokeLinecap="round" />
      <path d="M97 98l7-6" stroke={paper} strokeWidth="9" strokeLinecap="round" />
      <path d="M96.5 98.5l2-1.8" stroke={orange} strokeWidth="9" strokeLinecap="butt" />
      <g transform="translate(104 91) rotate(-48)">
        <path d="M-1 -1h15c3.5 0 6 2.5 6 6v2c0 1.5-1 2.5-2.5 2.5H-4c-3 0-5-2-5-5s2-5.5 5-5.5z" fill={orange} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
        <path d="M-7 7.5h26" stroke={paper} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M3 1l2 4M8 0l2 4" stroke={ink} strokeWidth="1.8" strokeLinecap="round" />
      </g>

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
