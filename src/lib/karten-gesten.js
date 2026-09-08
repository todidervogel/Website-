import { useEffect } from 'react'
import { zentrumHalten, zoomBegrenzen } from './map'

/**
 * Schieben und Zoomen auf der Karte.
 *
 * ┌─ Wer benutzt diese Datei ────────────────────────────────────────────────┐
 * │  src/routes/public/MapView.jsx   die Karte selbst                       │
 * │  src/lib/map.js                  entprojizieren() und zentrumHalten()   │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * ── Warum von Hand und nicht mit einer Kartenbibliothek ───────────────────
 *
 * Weil das Zeichnen schon von Hand läuft (lib/map.js, dreißig Zeilen
 * Rechnung). Eine Bibliothek würde ihre eigene Zustandsverwaltung mitbringen
 * und beides müsste sich einigen, wer die Wahrheit hält. Was hier fehlt,
 * sind Dinge, die dieser MVP nicht braucht: Drehen, Neigen, Vektorkacheln.
 *
 * ── Was hier zusammenkommt ────────────────────────────────────────────────
 *
 *   ein Finger oder Maustaste   schieben
 *   zwei Finger                 zoomen, der Punkt dazwischen bleibt stehen
 *   Mausrad                     zoomen, der Punkt unter dem Zeiger bleibt
 *   Doppeltipp                  eine Stufe näher
 *
 * Der Punkt unter dem Finger bleibt stehen, das ist der ganze Trick. Ohne
 * ihn springt der Ausschnitt bei jedem Zoomschritt, und man verliert sofort,
 * was man sich gerade ansehen wollte.
 */
export function useKartenGesten(flaeche, blickRef, aendern) {
  useEffect(() => {
    const el = flaeche.current
    if (!el) return undefined

    /* Alle Finger, die gerade auf der Karte liegen. */
    const zeiger = new Map()
    let letzterAbstand = null

    const masse = () => {
      const kasten = el.getBoundingClientRect()
      return { kasten, width: kasten.width, height: kasten.height }
    }

    const imKasten = (kasten, e) => ({ left: e.clientX - kasten.left, top: e.clientY - kasten.top })

    const abstandUndMitte = (kasten) => {
      const [a, b] = [...zeiger.values()]
      return {
        abstand: Math.hypot(a.x - b.x, a.y - b.y),
        mitte: { left: (a.x + b.x) / 2 - kasten.left, top: (a.y + b.y) / 2 - kasten.top },
      }
    }

    /** Zoomen mit einem Punkt, der stehen bleibt. */
    const zoomen = (stufen, pixel) => {
      const blick = blickRef.current
      if (!blick) return
      const { width, height } = masse()
      const zoom = zoomBegrenzen(blick.genauerZoom + stufen)
      /* Nichts zu tun, wenn wir schon am Anschlag sind. */
      if (Math.abs(zoom - blick.genauerZoom) < 1e-6) return
      const ort = blick.entprojizieren(pixel)
      aendern({ center: zentrumHalten({ ort, pixel, zoom, width, height }), zoom })
    }

    const runter = (e) => {
      zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (zeiger.size === 2) letzterAbstand = abstandUndMitte(masse().kasten).abstand
      if (zeiger.size === 1) {
        try { el.setPointerCapture(e.pointerId) } catch { /* egal, dann eben ohne */ }
        el.classList.add('is-greifend')
      }
    }

    const bewegen = (e) => {
      if (!zeiger.has(e.pointerId)) return
      const vorher = zeiger.get(e.pointerId)
      zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY })

      const blick = blickRef.current
      if (!blick) return
      const { kasten, width, height } = masse()

      if (zeiger.size === 1) {
        const dx = e.clientX - vorher.x
        const dy = e.clientY - vorher.y
        if (!dx && !dy) return
        /* Welcher Ort liegt nach dem Schieben in der Mitte? */
        const mitte = blick.entprojizieren({ left: width / 2 - dx, top: height / 2 - dy })
        aendern({ center: mitte, zoom: blick.genauerZoom })
        return
      }

      if (zeiger.size === 2) {
        const { abstand, mitte } = abstandUndMitte(kasten)
        if (!letzterAbstand || abstand < 1) { letzterAbstand = abstand; return }
        zoomen(Math.log2(abstand / letzterAbstand), mitte)
        letzterAbstand = abstand
      }
    }

    const hoch = (e) => {
      zeiger.delete(e.pointerId)
      if (zeiger.size < 2) letzterAbstand = null
      if (zeiger.size === 0) el.classList.remove('is-greifend')
    }

    const rad = (e) => {
      /*
       * `preventDefault` geht nur mit einem Zuhörer, der nicht als „passiv"
       * angemeldet ist. Deshalb hängt dieser hier von Hand und nicht über
       * onWheel im JSX: React meldet Radzuhörer passiv an, und dann scrollt
       * die Seite mit, während man zoomen will.
       */
      e.preventDefault()
      const { kasten } = masse()
      /* Feines Rad, grobes Wischen: die Schrittweite kommt in drei Einheiten. */
      const einheit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1
      zoomen((-e.deltaY * einheit) / 420, imKasten(kasten, e))
    }

    const doppelt = (e) => {
      const { kasten } = masse()
      zoomen(1, imKasten(kasten, e))
    }

    el.addEventListener('pointerdown', runter)
    el.addEventListener('pointermove', bewegen)
    el.addEventListener('pointerup', hoch)
    el.addEventListener('pointercancel', hoch)
    el.addEventListener('pointerleave', hoch)
    el.addEventListener('wheel', rad, { passive: false })
    el.addEventListener('dblclick', doppelt)

    return () => {
      el.removeEventListener('pointerdown', runter)
      el.removeEventListener('pointermove', bewegen)
      el.removeEventListener('pointerup', hoch)
      el.removeEventListener('pointercancel', hoch)
      el.removeEventListener('pointerleave', hoch)
      el.removeEventListener('wheel', rad)
      el.removeEventListener('dblclick', doppelt)
    }
  }, [flaeche, blickRef, aendern])
}
