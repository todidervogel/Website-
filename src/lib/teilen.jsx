import { useCallback } from 'react'
import { useToast } from '../design/ui'
import { teilen } from './karten-links'
import { WEB_ADRESSE } from '../design/config'
import { t } from '../design/i18n'

/**
 * Teilen, an einer Stelle für die ganze Anwendung.
 *
 * ┌─ Wer benutzt diese Datei ────────────────────────────────────────────────┐
 * │  src/routes/public/Feed.jsx         Knopf und Menüpunkt am Video         │
 * │  src/routes/public/VideoDetail.jsx  Knopf unter dem Video                │
 * │  src/routes/public/PlacePage.jsx    Knopf und Menü am Betrieb            │
 * │  src/routes/public/MenuPage.jsx     Speisekarte weitergeben              │
 * │  src/routes/nutzer/Profile.jsx      das eigene Profil                    │
 * │  src/lib/karten-links.js            die eigentliche Teilen-Funktion      │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * ── Was vorher war ────────────────────────────────────────────────────────
 *
 * An fünf Stellen stand `onClick={() => toast('Link kopiert')}`. Es kam eine
 * Meldung, es wurde nichts kopiert, und in der Zwischenablage lag, was vorher
 * darin lag. Das ist schlimmer als ein Knopf, der nichts tut: Es sieht aus,
 * als hätte es geklappt.
 *
 * ── Welche Adresse geteilt wird ───────────────────────────────────────────
 *
 * Nicht die, die gerade im Fenster steht. In der App ist das
 * `https://localhost/...`, und damit kann niemand etwas anfangen, der die
 * Nachricht bekommt. Geteilt wird deshalb immer die öffentliche Adresse der
 * Web-App (design/config.js, WEB_ADRESSE).
 *
 * Auf der Webseite selbst nehmen wir, was im Fenster steht: Wer dort ist,
 * teilt genau die Seite, die er ansieht, mitsamt Unterpfad.
 */

/** Läuft die Oberfläche gerade auf dem Gerät statt auf der Webseite? */
function amGeraet() {
  if (typeof window === 'undefined') return true
  const { protocol, hostname } = window.location
  return protocol === 'capacitor:' || protocol === 'file:'
    || hostname === 'localhost' || hostname === '127.0.0.1'
}

/**
 * Aus einem Pfad in der App eine Adresse machen, die auch woanders trägt.
 *
 * @param pfad  etwa "/g/trattoria" oder "/v/v1"
 */
export function oeffentlicheAdresse(pfad) {
  const rein = String(pfad ?? '').replace(/^\/+/, '')
  if (amGeraet()) return `${WEB_ADRESSE.replace(/\/$/, '')}/${rein}`

  /* Auf der Webseite liegt die App je nach Veröffentlichung unter einem
     Unterpfad, deshalb über BASE_URL und nicht über die nackte Herkunft. */
  const basis = (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '')
  return new URL(`${basis}/${rein}`, window.location.origin).href
}

/**
 * Der Haken für die Screens.
 *
 *   const teilenJetzt = useTeilen()
 *   teilenJetzt({ pfad: `/v/${video.id}`, titel: video.caption })
 *
 * Meldet, was passiert ist: geteilt, kopiert, oder es ging nicht. Ein
 * Abbruch im Teilen-Dialog des Geräts ist kein Fehler und bleibt still.
 */
export function useTeilen() {
  const toast = useToast()

  return useCallback(async ({ pfad, titel, text }) => {
    const ergebnis = await teilen({ titel, text, adresse: oeffentlicheAdresse(pfad) })
    if (!ergebnis.ok) return toast(t('toast.shareFailed'), 'error')
    if (ergebnis.weg === 'kopiert') return toast(t('toast.linkCopied'))
    if (ergebnis.weg === 'geteilt') return toast(t('toast.shared'))
    return undefined
  }, [toast])
}
