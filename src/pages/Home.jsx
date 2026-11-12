import { Link } from 'react-router-dom'
import { EVENT, asset } from '../lib/supabase.js'
import Matches from '../components/Matches.jsx'

const Ball = ({ className }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <defs>
      <radialGradient id="ballShade" cx="38%" cy="32%" r="70%">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.75" stopColor="#e9e9e6" />
        <stop offset="1" stopColor="#b9b9b4" />
      </radialGradient>
      <clipPath id="ballClip"><circle cx="32" cy="32" r="30" /></clipPath>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#ballShade)" />
    <g clipPath="url(#ballClip)" fill="#111417">
      <polygon points="32.00,21.50 41.99,28.76 38.17,40.49 25.83,40.49 22.01,28.76" />
      <polygon points="32.00,15.00 22.49,8.09 26.12,-3.09 37.88,-3.09 41.51,8.09" /><polygon points="48.17,26.75 51.80,15.57 63.56,15.57 67.19,26.75 57.68,33.66" /><polygon points="41.99,45.75 53.75,45.75 57.38,56.93 47.87,63.84 38.36,56.93" /><polygon points="22.01,45.75 25.64,56.93 16.13,63.84 6.62,56.93 10.25,45.75" /><polygon points="15.83,26.75 6.32,33.66 -3.19,26.75 0.44,15.57 12.20,15.57" />
    </g>
    <g clipPath="url(#ballClip)" stroke="#111417" strokeWidth="1.6" strokeLinecap="round" fill="none">
      <path d="M32.00 21.50L32.00 15.00M41.99 28.76L48.17 26.75M38.17 40.49L41.99 45.75M25.83 40.49L22.01 45.75M22.01 28.76L15.83 26.75" />
    </g>
    <circle cx="32" cy="32" r="30" fill="none" stroke="#111417" strokeWidth="1.5" />
    <ellipse cx="24" cy="20" rx="7" ry="4" fill="#fff" opacity="0.55" transform="rotate(-30 24 20)" />
  </svg>
)

const menu = [
  { land: 'England', flag: ['#fff', '#CE1124', '#fff'], claim: 'Mutterland des Fussballs', dish: 'Fish & Chips', note: 'Knusprig aus der Fritteuse, wie im Pub an der Stamford Bridge. Unser Bestseller, CHF 18.–' },
  { land: 'Schweiz', flag: ['#DA291C', '#fff', '#DA291C'], claim: 'Heimat der FIFA – und des FCK', dish: 'Älplermagronen mit Apfelmus', note: 'Das Heimspiel auf dem Teller: Käse, Magronen, Zwiebeln, Apfelmus. Vegetarisch.' },
  { land: 'Deutschland', flag: ['#0E1114', '#DD0000', '#FFCE00'], claim: 'Viermal Weltmeister', dish: 'Fleischkäse im Mütschli & Brezel', note: 'Dazu Bier im Chübeli aus der Bierschenke – auch alkoholfrei.' },
  { land: 'Brasilien', flag: ['#009739', '#FEDD00', '#012169'], claim: 'Rekordweltmeister & Gastgeber der Frauen-WM 2027', dish: 'Batida de Coco & Ipanema', note: 'An der Brasil-Bar, mit oder ohne Alkohol. Copacabana-Stimmung bis spät.' },
]

const partners = [
  { name: 'Halter', url: 'https://www.halter.ch/', img: '/partner/halter.jpg' },
  { name: 'Gallo Baugeschäft AG', url: 'https://www.gallobau.ch/', img: '/partner/gallo.jpg' },
  { name: 'Universal', url: 'https://u-f.ch/', img: '/partner/universal.jpg' },
  { name: 'Niederer – mobil in immobilien', url: 'https://niederer.com/de', img: '/partner/niederer.jpg' },
  { name: 'Treska Gerüstbau', url: 'https://www.treska-geruestbau.ch/', img: '/partner/treska.jpg' },
  { name: 'Kargo68', url: 'https://kargo68.ch/', img: '/partner/kargo68.jpg' },
]

function Wheat({ className }) {
  return (
    <svg viewBox="0 0 80 200" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M40 198V60" />
      {[60, 80, 100, 120, 140].map((y, i) => (
        <g key={y}>
          <path d={`M40 ${y} C 28 ${y - 6}, 20 ${y - 18}, 22 ${y - 30} C 34 ${y - 26}, 40 ${y - 14}, 40 ${y}`} />
          <path d={`M40 ${y} C 52 ${y - 6}, 60 ${y - 18}, 58 ${y - 30} C 46 ${y - 26}, 40 ${y - 14}, 40 ${y}`} />
        </g>
      ))}
      <path d="M40 60 C 34 50, 34 36, 40 24 C 46 36, 46 50, 40 60" />
    </svg>
  )
}

export default function Home() {
  return (
    <>
      {/* Hero – Logo + Plakat */}
      <section className="relative overflow-hidden bg-paper">
        <div className="absolute inset-0 dots opacity-30 pointer-events-none" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 pt-10 pb-10 md:pt-16 md:pb-14 grid gap-8 md:grid-cols-[1.1fr_1fr] items-center">
          <div>
            <p className="font-display text-orange-deep text-xl md:text-2xl font-semibold">Das FC Beizli am Dorffest Kirchberg BE</p>
            <h1 className="mt-3 display-narrow text-[clamp(3.4rem,10vw,9rem)] leading-[0.85]">
              Home of<br /><span className="swoosh">Football</span>
            </h1>
            <div className="mt-7 flex flex-wrap items-center gap-5">
              <span className="sticker text-xl md:text-2xl">16.–18. Juli 2027</span>
              <p className="font-display font-semibold text-2xl md:text-3xl">Schnittersunnti Kirchberg</p>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/helfer" className="btn btn-primary text-lg">Wunschschicht eintragen</Link>
              <a href="#angebot" className="btn btn-ghost text-lg">Was es gibt</a>
            </div>
          </div>
          <div className="relative">
            <img src={asset("/logo.png")} alt="Home of Football – Logo des FC Beizli" width="1000" height="1138"
              className="w-[70%] max-w-xs mx-auto md:w-full md:max-w-md drop-shadow-[0_18px_40px_rgba(255,112,0,0.25)]" fetchPriority="high" />
            <span className="absolute -bottom-5 -right-2 md:-right-6 w-12 md:w-16 grid place-items-end" aria-hidden="true"><span className="ball-shadow block h-2 w-10 md:w-12 rounded-full bg-ink/20 blur-[2px]" /><Ball className="ball absolute bottom-1 w-12 md:w-16" /></span>
          </div>
        </div>

        <div className="relative bg-stroh-light overflow-hidden">
          <div className="mx-auto max-w-6xl px-4 py-8 grid gap-4 sm:grid-cols-3">
            {EVENT.days.map((d, i) => (
              <div key={d.key} className={`ticket text-white p-5 pl-[34%] ${['tilt-l', '', 'tilt-r'][i]}`}>
                <span className="absolute left-5 top-1/2 -translate-y-1/2 -rotate-90 origin-center font-display font-extrabold text-orange text-lg tracking-widest whitespace-nowrap">TAG {i + 1}</span>
                <p className="font-display font-bold text-2xl md:text-3xl">{d.label}</p>
                <p className="text-white/60 text-sm">{d.date} {EVENT.year}</p>
                <p className="font-display text-orange text-2xl md:text-3xl mt-2 display-wide">{d.hours}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto max-w-6xl px-4 pb-6 text-ink/60">Schulhausstrasse, Dorfzentrum Kirchberg · keine Reservation nötig, einfach vorbeikommen.</p>
          <div className="hero-rule" />
        </div>
      </section>

      {/* Teaser Helferanmeldung */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 grid gap-6 md:grid-cols-[auto_1fr_auto] items-center">
          <span className="sticker text-base md:text-lg !shadow-[0_6px_0_#ff7000] !bg-white justify-self-start">Jetzt neu</span>
          <div>
            <p className="font-display font-bold text-2xl md:text-3xl leading-tight">Jetzt registrieren und deine Wunschschicht eintragen</p>
            <p className="mt-1 text-white/70">Konto erstellen, Schichten merken, die passen – das OK teilt im Januar zu. Wer früh dran ist, hat die Auswahl.</p>
          </div>
          <Link to="/helfer" className="btn btn-primary text-lg justify-self-start md:justify-self-end">Zum Helferportal</Link>
        </div>
      </section>

      {/* Angebot */}
      <section id="angebot" className="scroll-mt-20 bg-stroh-light">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="text-4xl md:text-5xl">Vier grosse<br />Fussballnationen,<br /><span className="swoosh">ein Beizli</span></h2>
            <p className="mt-6 text-ink/80 max-w-md">
              England, Schweiz, Deutschland, Brasilien: Jede Nation bringt ihr Gericht oder ihren Drink mit.
              Unser Areal an der Schulhausstrasse wird so zum «Home of Football» – Festwirtschaft, Biergarten und Bar unter einem Dach.
              Dazu Wein von Legio Julius und eine alkoholfreie Auswahl für alle.
            </p>
            <p className="mt-4 text-ink/80 max-w-md">Neu: am Tisch per QR-Code bestellen und mit Twint bezahlen – wir bringen es dir an den Tisch.</p>
            <p className="mt-4 text-ink/80 max-w-md">Und auf dem Screen: die K.o.-Spiele der Frauen-WM 2027 – <a href="#spiele" className="underline hover:text-orange-deep">was wir zeigen</a>.</p>
            <a href={asset("/karte-2026.jpg")} target="_blank" rel="noreferrer" className="btn btn-ghost mt-6">Karte 2026 ansehen</a>
            <figure className="mt-8 max-w-md">
              <img src={asset("/beizli-lounge.jpg")} alt="Gäste in Liegestühlen und auf Fussball-Sitzsäcken vor dem FC Beizli" loading="lazy" width="1600" height="1066" className="w-full aspect-[3/2] object-cover rounded-2xl" />
              <figcaption className="mt-2 text-sm text-ink/60">Platz nehmen im Home of Football – Liegestühle und Fussball-Lounge im Aussenbereich.</figcaption>
            </figure>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 items-start">
            {menu.map((m, i) => (
              <li key={m.dish} className={`bg-paper rounded-2xl p-6 shadow-[0_8px_0_#0E1114] border-2 border-ink ${i % 2 ? 'tilt-r' : 'tilt-l'}`}>
                <div className="flag" aria-hidden="true">{m.flag.map((c, k) => <i key={k} style={{ background: c }} />)}</div>
                <p className="font-display font-extrabold text-2xl mt-4 leading-none">{m.land}</p>
                <p className="text-sm text-orange-deep font-semibold mt-1">{m.claim}</p>
                <p className="font-display font-bold text-2xl mt-4 leading-tight">{m.dish}</p>
                <p className="mt-3 text-ink/70">{m.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Matches />

      {/* Schnittersunnti – Geschichte */}
      <section id="schnittersunnti" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 grid gap-12 md:grid-cols-[auto_1fr] items-start">
          <Wheat className="hidden md:block h-72 text-orange" />
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl">Warum <span className="swoosh">«Schnitter»</span>?</h2>
            <div className="mt-6 space-y-4 text-ink/85 text-lg leading-relaxed">
              <p>
                Kirchberg freut sich jedes Jahr auf den dritten Sonntag im Juli. Frühmorgens stellen die Händler
                ihre Marktstände am Schulweg auf – bis nach dem Zweiten Weltkrieg fand der Markt noch auf der
                Hauptstrasse entlang der Sonnenkurve statt.
              </p>
              <p>
                An diesem Tag «dingte» der Getreidebauer seine Schnitterinnen und Schnitter für die kommende Ernte.
                Sie stammten meist aus dem oberen Emmental, wo die Ernte erst im Spätsommer eingebracht wurde.
              </p>
              <p>
                Heute kommen die «Heimweh-Kirchberger» zurück ins Dorf, treffen Bekannte und Freunde. Die von
                den Dorfvereinen geführten Beizli bilden den Rahmen – ab Freitagabend. Schnitter braucht niemand
                mehr, aber der dritte Julisonntag bleibt für Kirchberg ein Festtag.
              </p>
            </div>
            <Link to="/rueckblick-2026" className="btn btn-ghost mt-8">Rückblick 2026 lesen</Link>
          </div>
        </div>
      </section>

      {/* Verein */}
      <section id="verein" className="scroll-mt-20 bg-ink text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 grid gap-10 md:grid-cols-2 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl">FC Kirchberg<br />seit 1924</h2>
            <p className="mt-6 text-white/75 max-w-md">
              Mehr als ein Fussballverein: eine Fussballfamilie in Orange und Schwarz. Das Beizli am
              Schnittersunnti ist unser wichtigster Anlass im Jahr – organisiert und betrieben von Mitgliedern,
              Eltern und Freunden des Vereins.
            </p>
            <a href="https://www.fc-kirchberg.ch/" target="_blank" rel="noreferrer" className="btn btn-primary mt-8">Zum Verein</a>
          </div>
          <div className="grid gap-px bg-white/20 border border-white/20 sm:grid-cols-[auto_1fr]">
            <img src={asset("/fck-wappen.jpg")} alt="Wappen FC Kirchberg BE, gegründet 1924" width="800" height="800" loading="lazy" className="w-full sm:w-56 aspect-square object-cover" />
            <dl className="bg-ink grid grid-cols-2 gap-6 p-6">
              {[['115', 'Helferplätze'], ['3', 'Festtage'], ['4', 'Länder-Küchen'], ['1924', 'gegründet']].map(([n, l]) => (
                <div key={l}>
                  <dt className="text-white/60">{l}</dt>
                  <dd className="font-display font-extrabold text-4xl text-orange mt-1">{n}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Helfen */}
      <section id="helfen" className="scroll-mt-20 bg-orange text-ink relative overflow-hidden">
        <Ball className="roll absolute bottom-3 left-0 w-10 opacity-80 pointer-events-none" />
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20 grid gap-8 md:grid-cols-[1.4fr_1fr] items-center">
          <div>
            <h2 className="text-4xl md:text-5xl">Dein Einsatz<br /><span className="swoosh">im Beizli</span></h2>
            <p className="mt-5 text-ink/80 max-w-lg">
              115 Helferplätze in Theke, Küche, Service, Bar und Kasse – getragen von Mitgliedern und Freunden des
              FC Kirchberg. Registriere dich jetzt und merke dir deine Wunschschichten – die Zuteilung macht das OK im Januar, danach wählst du frei, was noch offen ist.
            </p>
          </div>
          <div className="md:justify-self-end">
            <Link to="/helfer" className="btn btn-dark text-lg">Schichtplan öffnen</Link>
            <p className="mt-3 text-sm text-ink/70">Mit Login – deine Schichten bleiben für dich sichtbar.</p>
          </div>
        </div>
      </section>

      {/* Partner */}
      <section id="partner" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <h2 className="text-3xl md:text-4xl">Unsere Partner</h2>
          <ul className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {partners.map((p, i) => (
              <li key={p.name} className={['tilt-l', 'tilt-r', '', 'tilt-r', 'tilt-l', ''][i % 6]}>
                <a href={p.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl ring-2 ring-transparent hover:ring-orange transition-shadow">
                  <img src={asset(p.img)} alt={p.name} width="800" height="800" loading="lazy" className="w-full aspect-square object-cover" />
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ink/60">Partner werden? <a href={`mailto:${EVENT.contact.email}`} className="underline hover:text-orange-deep">Melde dich</a> – Logo auf Website, Karte und Banner im Beizli.</p>
        </div>
      </section>
    </>
  )
}
