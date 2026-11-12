import { Link } from 'react-router-dom'
import { asset } from '../lib/supabase.js'

export default function Rueckblick() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <p className="font-display font-semibold text-orange-deep text-lg">Rückblick</p>
      <h1 className="text-4xl md:text-6xl mt-1">Schnittersunnti 2026</h1>
      <p className="mt-3 text-ink/60">Aus den Clubnachrichten des FC Kirchberg</p>

      <img src={asset('/beizli-lounge.jpg')} alt="Gäste in Liegestühlen und auf Fussball-Sitzsäcken vor dem FC Beizli" width="1600" height="1066" className="mt-8 w-full rounded-2xl" />

      <div className="mt-10 space-y-5 text-lg leading-relaxed text-ink/90">
        <p className="font-semibold">Liebe FCK-Familie</p>
        <p>Das Beizli hat wieder gelebt. Am Freitag, 17. Juli, haben wir um sechs Uhr abends den Zapfhahn aufgedreht, am Sonntagabend war das Zelt leer und am Montagmittag stand nur noch der Torbogen. Dazwischen lagen drei Tage, an denen man in Kirchberg niemanden lange suchen musste: Alle waren irgendwann an der Schulhausstrasse.</p>
        <p>Neu war in diesem Jahr der Aussenbereich. Die Liegestühle mit dem Home-of-Football-Logo und die aufblasbaren Fussball-Sessel waren vom ersten Nachmittag an besetzt, bei den Kindern sowieso. Der Torbogen hat sich als Treffpunkt bewährt, und die Sonnenschirme haben am Samstag gute Dienste geleistet.</p>
        <p>Die Karte war komplett neu, und sie hat sich bewährt: Fish & Chips, Älplermagronen mit Apfelmus, Fleischkäse im Mütschli, an der Brasil-Bar Batida de Coco und Ipanema. Fish & Chips war einmal mehr das meistbestellte Gericht, die Küche kam am Samstagabend an ihre Grenzen und hat trotzdem alles rausgebracht. Dazu Bier im Chübeli, Wein von Legio Julius, und für die Jungen und die Fahrer eine anständige Auswahl ohne Alkohol.</p>
        <p>Der Samstag war, wie jedes Jahr, der grosse Tag. Wir haben erst am späten Nachmittag geöffnet, und ab dann war das Zelt bis weit nach Mitternacht voll: die Cliquen, die Heimweh-Kirchberger, die man nur einmal im Jahr sieht, und alle, die noch nicht nach Hause wollten. Am Freitag hat Roger Niederer den FCK-Netzwerklunch bei uns durchgeführt, am Sonntag war Familienzeit mit vielen Junioren-Eltern im Einsatz.</p>

        <h2 className="text-2xl md:text-3xl pt-4">Public Viewing zur WM</h2>
        <p>Weil die WM in unser Festwochenende fiel, haben wir dieses Jahr eine Grossleinwand aufgestellt und die Spiele gezeigt. Das hat zum Jahr gepasst und hat Stimmung gemacht, gerade am Freitagabend. Eine WM gibt es aber nur alle vier Jahre, und das Beizli funktioniert auch ohne: Die Leute kommen, um sich zu sehen. 2027 konzentrieren wir uns deshalb wieder aufs Kerngeschäft, auf einen Samstag mit genug Leuten hinter der Theke, einen entspannten Sonntag und einen Aufbau, der die Crew nicht schon vor dem Fest müde macht.</p>
        <p>Die Schlussabrechnung ist gemacht, die Zahlen habt Ihr an der Versammlung gesehen. Hier nur so viel: Das Beizli hat sich für den Verein gelohnt.</p>

        <h2 className="text-2xl md:text-3xl pt-4">Merci</h2>
        <p>So ein Fest macht sich nicht von allein. Danke an alle, die eine oder mehrere Schichten übernommen haben, aus der Ersten, der Zweiten, den Senioren, dem Juniorenbereich und dem Vorstand, und an die Freunde des FCK, die ohne Trikot kommen und trotzdem bis zwei Uhr an der Bar stehen. Danke an die Montagscrew, die abgeräumt hat, als die anderen schon wieder bei der Arbeit waren. Danke an unsere Partner Halter, Gallo Baugeschäft, Universal, Niederer, Treska Gerüstbau und Kargo68. Und danke an alle, die bei uns gegessen und getrunken haben.</p>

        <h2 className="text-2xl md:text-3xl pt-4">2027</h2>
        <p>Der nächste Schnittersunnti ist vom 16. bis 18. Juli 2027. Das Beizli ist wieder dabei, am Sonntag bis 18 Uhr. Drei Dinge werden anders:</p>
        <p>Die Schichten gibt es neu hier auf schnittersunnti.ch. Jede und jeder meldet sich mit einem eigenen Login an und wählt die Schicht selbst. Die Anmeldung öffnet im Januar. Wer früh ist, hat die Auswahl.</p>
        <p>Wir testen das Bestellen am Tisch: QR-Code scannen, auswählen, mit Twint bezahlen, und das Essen und die Getränke werden an den Tisch gebracht.</p>
        <p>Und das OK bekommt einen Fest-Paten aus dem Vorstand als festen Ansprechpartner.</p>
        <p>Haltet Euch das Wochenende frei. Wir brauchen Euch, als Helfende und als Gäste.</p>
        <p><span className="font-semibold">Stefan Moser</span><br /><span className="text-ink/60">für das OK FC Beizli</span></p>
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link to="/helfer" className="btn btn-primary">Zum Helfereinsatz</Link>
        <Link to="/" className="btn btn-ghost">Zur Startseite</Link>
      </div>
    </article>
  )
}
