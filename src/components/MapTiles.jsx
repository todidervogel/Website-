import { useEffect, useState } from 'react'
import { kachelAdresse } from '../lib/map'
import { request, SERVER } from '../lib/store'
import { t } from '../design/i18n'

/**
 * Wie der Kartenanbieter genannt werden will.
 *
 * Die Nennung ist keine Höflichkeit, sondern Bedingung: OpenStreetMap steht
 * unter der ODbL, CARTO verlangt sie ebenfalls. Welcher Stil gerade läuft,
 * entscheidet der Server (Server/src/http/karte.js), also fragt die Karte
 * ihn danach, statt es zu erraten.
 *
 * Einmal je Sitzung, nicht je Karte: Der Stil ändert sich nicht zwischen zwei
 * Bildschirmen.
 */
let nennungVersprechen = null

function nennungHolen() {
  if (!SERVER) return Promise.resolve(null)
  nennungVersprechen ??= request('/api/karte/stil')
    .then((stil) => stil?.nennung ?? null)
    .catch(() => null)
  return nennungVersprechen
}

/* ==========================================================================
   Kacheln holen
   ========================================================================== */

/**
 * ┌─ Warum die Kacheln nicht einfach in einem <img> stehen ──────────────────┐
 * │  Weil zwischen App und Server ein ngrok-Tunnel liegt, und der schiebt    │
 * │  Browsern eine Warnseite unter, statt das Bild durchzulassen. Sie kommt  │
 * │  mit Status 200 und HTML. Ein <img> kann keine Kopfzeile mitschicken,    │
 * │  also bekam es die Warnseite, konnte sie nicht anzeigen und blendete     │
 * │  sich aus. Ergebnis auf dem Handy: keine Karte, nur der graue Raster-    │
 * │  hintergrund. Genau so kam es zurück: „die map wird nicht vom Server     │
 * │  geladen".                                                               │
 * │                                                                          │
 * │  Über `fetch` geht die Kopfzeile mit. Aus der Antwort wird eine          │
 * │  Objekt-Adresse, und die versteht ein <img> wieder.                      │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Nebenbei bekommen wir damit einen Zwischenspeicher im Gerät: Beim Schieben
 * und Zoomen kommen dieselben Kacheln immer wieder vor. Ohne ihn wäre jede
 * Bewegung ein neuer Aufruf über den Tunnel.
 */
const AUFBEWAHREN = 400

const gespeichert = new Map()
const unterwegs = new Map()

const schluesselVon = (k, basis) => `${basis}|${k.zoom}/${k.x}/${k.y}`

function merken(schluessel, adresse) {
  gespeichert.set(schluessel, adresse)
  /* Ältestes zuerst hinaus, `Map` behält die Reihenfolge des Einfügens. */
  while (gespeichert.size > AUFBEWAHREN) {
    const aeltestes = gespeichert.keys().next().value
    const alt = gespeichert.get(aeltestes)
    gespeichert.delete(aeltestes)
    if (alt?.startsWith('blob:')) URL.revokeObjectURL(alt)
  }
}

function kachelHolen(k, basis) {
  /* Ohne Server geht es direkt zu OpenStreetMap, dort liegt kein Tunnel dazwischen. */
  if (!basis) return Promise.resolve(kachelAdresse(k))

  const schluessel = schluesselVon(k, basis)
  if (gespeichert.has(schluessel)) return Promise.resolve(gespeichert.get(schluessel))
  if (unterwegs.has(schluessel)) return unterwegs.get(schluessel)

  const versprechen = fetch(kachelAdresse(k, basis), {
    headers: { 'ngrok-skip-browser-warning': '1' },
  })
    .then((antwort) => (antwort.ok ? antwort.blob() : null))
    .then((blob) => {
      /*
       * Kommt trotzdem etwas anderes als ein Bild zurück, ist es die
       * Warnseite oder eine Fehlerseite. Beides ist keine Kachel.
       */
      if (!blob || !blob.type.startsWith('image/')) return null
      const adresse = URL.createObjectURL(blob)
      merken(schluessel, adresse)
      return adresse
    })
    .catch(() => null)
    .finally(() => unterwegs.delete(schluessel))

  unterwegs.set(schluessel, versprechen)
  return versprechen
}

/** Eine Kachel. Zeigt sich erst, wenn sie wirklich da ist. */
function Kachel({ k, basis }) {
  const [adresse, setAdresse] = useState(() => (basis ? gespeichert.get(schluesselVon(k, basis)) ?? null : null))

  useEffect(() => {
    let abgebrochen = false
    kachelHolen(k, basis).then((gefunden) => { if (!abgebrochen) setAdresse(gefunden) })
    return () => { abgebrochen = true }
    /* Nur die Kachel selbst zählt, ihre Lage im Kasten ändert sich beim Schieben. */
  }, [k.zoom, k.x, k.y, basis])

  if (!adresse) return null

  return (
    <img
      className="map-tile"
      src={adresse}
      alt=""
      draggable={false}
      style={{ left: k.left, top: k.top, width: k.groesse, height: k.groesse }}
    />
  )
}

/**
 * Die Karte darunter, echte Kacheln.
 *
 * ┌─ Woher die Kacheln kommen ───────────────────────────────────────────────┐
 * │  mit Server   Server/src/http/karte.js, zwischengespeichert, im Stil,    │
 * │               den KARTE_STIL vorgibt                                     │
 * │  ohne Server  direkt von tile.openstreetmap.org (siehe lib/map.js)       │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Bewusst ohne Kartenbibliothek: MapLibre oder Leaflet bringen je nach Aufbau
 * 40 bis 250 KB mit und wollen ihre eigene Zustandsverwaltung. Gebraucht wird
 * hier aber nur ein Raster aus Bildern an der richtigen Stelle, das sind
 * dreißig Zeilen Rechnung in `lib/map.js`.
 *
 * Geladen wird nur, was im Bild liegt. Beim Schieben kommen die Kacheln am
 * neuen Rand dazu, die alten bleiben im Zwischenspeicher.
 *
 * Kommen die Kacheln nicht (kein Netz, App im Flugmodus), bleibt der graue
 * Rasterhintergrund von `.map-canvas` stehen. Die Marker sitzen trotzdem
 * richtig, weil sie aus derselben Rechnung kommen.
 *
 * Gemessen und gerechnet wird eine Ebene höher (src/lib/karten-blick.js).
 * Diese Datei bekommt das Ergebnis und zeichnet es. So sitzen Kacheln und
 * Marker im selben Bild, statt um einen Zeichenschritt versetzt.
 */
export function MapTiles({ blick }) {
  const [nennung, setNennung] = useState(null)

  useEffect(() => {
    let abgebrochen = false
    nennungHolen().then((text) => { if (!abgebrochen && text) setNennung(text) })
    return () => { abgebrochen = true }
  }, [])

  return (
    <div className="map-tiles" aria-hidden="true">
      {blick?.kacheln.map((k) => <Kachel key={k.schluessel} k={k} basis={SERVER} />)}
      <span className="map-credit">{nennung ?? t('map.credit')}</span>
    </div>
  )
}
