import { useEffect, useRef, useState } from 'react'
import { kachelAdresse, kartenblick } from '../lib/map'
import { SERVER } from '../lib/store/api'
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
  nennungVersprechen ??= fetch(`${SERVER}/api/karte/stil`)
    .then((antwort) => (antwort.ok ? antwort.json() : null))
    .then((stil) => stil?.nennung ?? null)
    .catch(() => null)
  return nennungVersprechen
}

/**
 * Die Karte darunter, echte Kacheln.
 *
 * ┌─ Woher die Kacheln kommen ───────────────────────────────────────────────┐
 * │  mit Server   Server/src/http/karte.js, zwischengespeichert, im Stil     │
 * │               „Voyager", der dem Bild von Google Maps am nächsten kommt  │
 * │  ohne Server  direkt von tile.openstreetmap.org (siehe lib/map.js)       │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Bewusst ohne Kartenbibliothek: MapLibre oder Leaflet bringen je nach Aufbau
 * 40 bis 250 KB mit und wollen ihre eigene Zustandsverwaltung. Gebraucht wird
 * hier aber nur ein Raster aus Bildern an der richtigen Stelle, das sind
 * dreißig Zeilen Rechnung in `lib/map.js`.
 *
 * Kommen die Kacheln nicht (kein Netz, App im Flugmodus), bleibt der graue
 * Rasterhintergrund von `.map-canvas` stehen. Die Marker sitzen trotzdem
 * richtig, weil sie aus derselben Rechnung kommen.
 *
 * `onProject` gibt die Projektion nach oben: Der Kartenschirm misst sich
 * selbst, und nur er weiß, wie groß er ist.
 */
export function MapTiles({ center, spanKm, onProject }) {
  const kasten = useRef(null)
  const [masse, setMasse] = useState(null)
  const [nennung, setNennung] = useState(null)

  useEffect(() => {
    let abgebrochen = false
    nennungHolen().then((text) => { if (!abgebrochen && text) setNennung(text) })
    return () => { abgebrochen = true }
  }, [])

  useEffect(() => {
    const el = kasten.current
    if (!el) return undefined
    const messen = () => {
      const { width, height } = el.getBoundingClientRect()
      setMasse((alt) =>
        alt && Math.abs(alt.width - width) < 1 && Math.abs(alt.height - height) < 1
          ? alt
          : { width, height })
    }
    messen()
    const beobachter = new ResizeObserver(messen)
    beobachter.observe(el)
    return () => beobachter.disconnect()
  }, [])

  const blick = masse && kartenblick({ center, spanKm, ...masse })

  /*
   * Die Projektion nach oben reichen, sobald sie feststeht. Über einen Effekt,
   * damit sie nicht mitten im Zeichnen den Zustand der Elternkomponente ändert.
   */
  useEffect(() => {
    if (blick && onProject) onProject(() => blick.projizieren)
  }, [blick, onProject])

  return (
    <div className="map-tiles" ref={kasten} aria-hidden="true">
      {blick?.kacheln.map((k) => (
        <img
          key={k.schluessel}
          className="map-tile"
          src={kachelAdresse(k, SERVER)}
          alt=""
          loading="lazy"
          draggable={false}
          /*
           * Ohne Netz gibt es keine Kacheln. Ein kaputtes Bild zeigt sonst das
           * Symbol des Browsers, vierzig kleine Symbole auf einer Karte sehen
           * schlimmer aus als gar keine Karte.
           */
          onError={(e) => { e.currentTarget.hidden = true }}
          style={{ left: k.left, top: k.top, width: k.groesse, height: k.groesse }}
        />
      ))}
      <span className="map-credit">{nennung ?? t('map.credit')}</span>
    </div>
  )
}
