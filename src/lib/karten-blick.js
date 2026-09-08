import { useEffect, useMemo, useRef, useState } from 'react'
import { kartenblick } from './map'

/**
 * Der Kartenausschnitt, gemessen und gerechnet.
 *
 * ┌─ Wer benutzt diese Datei ────────────────────────────────────────────────┐
 * │  src/routes/public/MapView.jsx    die Karte                             │
 * │  src/routes/public/Landing.jsx    die kleine Karte auf der Startseite   │
 * │  src/components/MapTiles.jsx      bekommt das Ergebnis zum Zeichnen     │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * ── Warum das Messen hier oben liegt und nicht in den Kacheln ─────────────
 *
 * Weil Kacheln und Marker im selben Bild sitzen müssen. Solange der
 * Kachelschirm sich selbst maß und die Rechnung nach oben meldete, kam sie
 * dort einen Zeichenschritt zu spät an: Beim Schieben lagen die Marker um ein
 * Bild versetzt hinter der Karte. Jetzt misst der Bildschirm, der beides
 * enthält, und beide bekommen dieselbe Rechnung im selben Durchgang.
 */
export function useKartenblick(kastenRef, { center, spanKm, zoom }) {
  const [masse, setMasse] = useState(null)
  const letzte = useRef(null)

  useEffect(() => {
    const el = kastenRef.current
    if (!el) return undefined
    const messen = () => {
      const { width, height } = el.getBoundingClientRect()
      setMasse((alt) => (alt && Math.abs(alt.width - width) < 1 && Math.abs(alt.height - height) < 1
        ? alt
        : { width, height }))
    }
    messen()
    const beobachter = new ResizeObserver(messen)
    beobachter.observe(el)
    return () => beobachter.disconnect()
  }, [kastenRef])

  return useMemo(() => {
    if (!masse) return null
    const blick = kartenblick({ center, spanKm, zoom, ...masse })
    letzte.current = blick
    return blick
  }, [center, spanKm, zoom, masse])
}
