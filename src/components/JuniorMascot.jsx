// Eigenes Maskottchen für den Junioren-Aufruf: Kind mit Schirmmütze, Nummer 12, kickt den Ball
export default function JuniorMascot({ className = '' }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <clipPath id="jm-face"><circle cx="54" cy="38" r="20" /></clipPath>
      </defs>
      {/* Ball */}
      <g className="jm-ball">
        <circle cx="96" cy="94" r="13" fill="#fff" stroke="#0E1114" strokeWidth="2.5" />
        <path d="M96 84l6 4.4-2.3 7h-7.4L90 88.4z" fill="#0E1114" />
        <path d="M96 84v-3M102 88.4l3-1.5M99.7 95.4l2 2.6M92.3 95.4l-2 2.6M90 88.4l-3-1.5" stroke="#0E1114" strokeWidth="2" strokeLinecap="round" />
      </g>
      {/* Beine */}
      <path d="M48 76l-6 26" stroke="#0E1114" strokeWidth="9" strokeLinecap="round" />
      <path d="M60 76l18 12" stroke="#0E1114" strokeWidth="9" strokeLinecap="round" />
      <path d="M36 104h14" stroke="#FF7000" strokeWidth="8" strokeLinecap="round" />
      <path d="M78 86l8 6" stroke="#FF7000" strokeWidth="8" strokeLinecap="round" />
      {/* Körper / Trikot */}
      <path d="M36 60c0-8 7-12 18-12s18 4 18 12v18H36z" fill="#fff" stroke="#0E1114" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M36 60l-8 6 4 5 4-3M72 60l8 6-4 5-4-3" fill="#fff" stroke="#0E1114" strokeWidth="2.5" strokeLinejoin="round" />
      <text x="54" y="74" textAnchor="middle" fontFamily="Bricolage Grotesque, Figtree, sans-serif" fontWeight="800" fontSize="14" fill="#FF7000">12</text>
      {/* Arme */}
      <path d="M30 66l-10 8" stroke="#0E1114" strokeWidth="7" strokeLinecap="round" />
      <path d="M78 66l10-12" stroke="#0E1114" strokeWidth="7" strokeLinecap="round" />
      {/* Kopf */}
      <circle cx="54" cy="38" r="20" fill="#F3E4B8" stroke="#0E1114" strokeWidth="2.5" />
      <g clipPath="url(#jm-face)">
        <circle cx="46" cy="36" r="3" fill="#0E1114" />
        <circle cx="62" cy="36" r="3" fill="#0E1114" />
        <circle cx="47.2" cy="35" r="1" fill="#fff" />
        <circle cx="63.2" cy="35" r="1" fill="#fff" />
        <path d="M44 45c4 6 16 6 20 0" stroke="#0E1114" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="41" cy="42" r="1.2" fill="#D45A00" /><circle cx="45" cy="44" r="1.2" fill="#D45A00" /><circle cx="63" cy="44" r="1.2" fill="#D45A00" /><circle cx="67" cy="42" r="1.2" fill="#D45A00" />
      </g>
      {/* Mütze (verkehrt herum) */}
      <path d="M34 30c2-12 12-18 22-18s19 6 21 18z" fill="#FF7000" stroke="#0E1114" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M77 29l16 4-3 6-14-4z" fill="#FF7000" stroke="#0E1114" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="56" cy="12" r="3" fill="#0E1114" />
    </svg>
  )
}
