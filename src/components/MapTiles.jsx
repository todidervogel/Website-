import { useEffect, useRef, useState } from 'react'
import { kachelAdresse, kartenblick } from '../lib/map'
import { t } from '../design/i18n'

/**
 * Die Karte darunter — echte Kacheln von OpenStreetMap.
 *
 * Bewusst ohne Kartenbibliothek: MapLibre oder Leaflet bringen je nach Aufbau
 * 40 bis 250 KB mit und wollen ihre eigene Zustandsverwaltung. Gebraucht wird
 * hier aber nur ein Raster aus Bildern an der richtigen Stelle — das sind
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
          src={kachelAdresse(k)}
          alt=""
          loading="lazy"
          draggable={false}
          /*
           * Ohne Netz gibt es keine Kacheln. Ein kaputtes Bild zeigt sonst das
           * Symbol des Browsers — vierzig kleine Symbole auf einer Karte sehen
           * schlimmer aus als gar keine Karte.
           */
          onError={(e) => { e.currentTarget.hidden = true }}
          style={{ left: k.left, top: k.top, width: k.groesse, height: k.groesse }}
        />
      ))}
      <span className="map-credit">{t('map.credit')}</span>
    </div>
  )
}
