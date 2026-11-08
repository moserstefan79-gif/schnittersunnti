import { Link } from 'react-router-dom'
import { EVENT } from '../lib/supabase.js'
import Matches from '../components/Matches.jsx'

const menu = [
  { land: 'Essen', dish: 'Fish & Chips, Älplermagronen, Fleischkäse im Mütschli', note: 'Drei Länder, eine Küche – ab CHF 9.–' },
  { land: 'Bierschenke', dish: 'Bier im Chübeli & Brezel', note: 'Auch alkoholfrei. Depot CHF 2.– auf den Becher.' },
  { land: 'Wein', dish: 'Legio Julius – weiss, rosé, rot', note: 'Glas 1 dl CHF 5.–, Flasche CHF 35.–' },
  { land: 'Brasil-Bar', dish: 'Batida de Coco & Ipanema', note: 'Mit oder ohne Alkohol, CHF 8.–/10.–' },
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
            <h1 className="mt-3 display-narrow text-[clamp(3.6rem,12vw,10.5rem)] leading-[0.85]">
              Home of<br />Football
            </h1>
            <p className="mt-5 font-display font-semibold text-2xl md:text-3xl">
              Schnittersunnti <span className="text-orange">2027</span> · 16.–18. Juli
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/helfer" className="btn btn-primary text-lg">Schicht übernehmen</Link>
              <a href="#angebot" className="btn btn-ghost text-lg">Was es gibt</a>
            </div>
          </div>
          <img src="/logo.png" alt="Home of Football – Logo des FC Beizli" width="1000" height="1138"
            className="w-[70%] max-w-xs mx-auto md:w-full md:max-w-md drop-shadow-[0_18px_40px_rgba(255,112,0,0.25)]" fetchPriority="high" />
        </div>

        <div className="relative bg-ink text-white">
          <div className="mx-auto max-w-6xl px-4 py-6 grid gap-6 sm:grid-cols-3">
            {EVENT.days.map(d => (
              <div key={d.key} className="flex items-baseline gap-4 sm:block">
                <p className="font-display font-bold text-2xl md:text-3xl">{d.label}<span className="text-white/60 font-sans font-normal text-base ml-2">{d.date}</span></p>
                <p className="font-display text-orange text-2xl md:text-3xl sm:mt-1 display-wide">{d.hours}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto max-w-6xl px-4 pb-6 text-white/60">Schulhausstrasse, Dorfzentrum Kirchberg · keine Reservation nötig, einfach vorbeikommen.</p>
          <div className="hero-rule" />
        </div>
      </section>

      {/* Angebot */}
      <section id="angebot" className="scroll-mt-20 bg-stroh-light">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="text-4xl md:text-5xl">Vier Länder,<br />ein Beizli</h2>
            <p className="mt-6 text-ink/80 max-w-md">
              Unser Areal an der Schulhausstrasse wird am Schnittersunnti zum «Home of Football»:
              Biergarten, Festwirtschaft und Bar – mit Küche aus vier Fussballnationen.
              Ob mit der Clique oder zum Leutetreffen: Hier ist Leben drin.
            </p>
            <p className="mt-4 text-ink/80 max-w-md">Neu: am Tisch per QR-Code bestellen und mit Twint bezahlen – wir bringen es dir oder du holst es an der Theke ab.</p>
            <p className="mt-4 text-ink/80 max-w-md">Und auf dem Screen: die K.o.-Spiele der Frauen-WM 2027 – <a href="#spiele" className="underline hover:text-orange-deep">was wir zeigen</a>.</p>
            <a href="/karte-2026.jpg" target="_blank" rel="noreferrer" className="btn btn-ghost mt-6">Karte 2026 ansehen</a>
            <figure className="mt-8 max-w-md">
              <img src="/liegestuhl.jpg" alt="Liegestuhl mit dem Home-of-Football-Logo" loading="lazy" width="1050" height="1400" className="w-full aspect-[3/4] object-cover object-[50%_60%] rounded-2xl" />
              <figcaption className="mt-2 text-sm text-ink/60">Platz nehmen im Home of Football – unsere Liegestühle warten.</figcaption>
            </figure>
          </div>
          <ul className="grid gap-px bg-line border border-line sm:grid-cols-2">
            {menu.map(m => (
              <li key={m.dish} className="bg-stroh-light p-6">
                <p className="text-sm font-medium text-orange-deep">{m.land}</p>
                <p className="font-display font-bold text-2xl mt-1 leading-tight">{m.dish}</p>
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
            <h2 className="text-4xl md:text-5xl">Warum «Schnitter»?</h2>
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
            <img src="/fck-wappen.jpg" alt="Wappen FC Kirchberg BE, gegründet 1924" width="800" height="800" loading="lazy" className="w-full sm:w-56 aspect-square object-cover" />
            <dl className="bg-ink grid grid-cols-2 gap-6 p-6">
              {[['108', 'Schichten'], ['3', 'Festtage'], ['4', 'Länder-Küchen'], ['1924', 'gegründet']].map(([n, l]) => (
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
      <section id="helfen" className="scroll-mt-20 bg-orange text-ink">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20 grid gap-8 md:grid-cols-[1.4fr_1fr] items-center">
          <div>
            <h2 className="text-4xl md:text-5xl">Dein Einsatz<br />im Beizli</h2>
            <p className="mt-5 text-ink/80 max-w-lg">
              108 Schichten in Theke, Küche, Service, Bar und Kasse – getragen von Mitgliedern und Freunden des
              FC Kirchberg. Bis am {EVENT.signupDeadline} wählst du deine Wunschschicht selbst; danach teilt der
              Vorstand die offenen Schichten den Mannschaften zu.
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
            {partners.map(p => (
              <li key={p.name}>
                <a href={p.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl ring-2 ring-transparent hover:ring-orange transition-shadow">
                  <img src={p.img} alt={p.name} width="800" height="800" loading="lazy" className="w-full aspect-square object-cover" />
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
