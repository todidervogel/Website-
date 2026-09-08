import { changed } from './events'

/**
 * Ob der Server gerade erreichbar ist.
 *
 * Der Grund für diese Datei: Ein fehlgeschlagener Aufruf und ein leeres
 * Ergebnis sehen in der Oberfläche gleich aus. Ohne diese Unterscheidung
 * stand auf der Startseite „In deinem Umkreis wurden noch keine Videos
 * hochgeladen“, während in Wahrheit gar keine Verbindung zustande kam.
 * Das ist keine Störungsmeldung, das ist eine Falschaussage.
 */
let offline = false
let seit = null
const hoerer = new Set()

const melden = () => hoerer.forEach((f) => f())

/** Ein Aufruf ist am Netz gescheitert, nicht am Inhalt. */
export function verbindungWeg() {
  if (offline) return
  offline = true
  seit = Date.now()
  melden()
}

/** Ein Aufruf kam durch. */
export function verbindungDa() {
  if (!offline) return
  offline = false
  seit = null
  melden()
  /* Was während der Störung leer blieb, soll jetzt nachgeladen werden. */
  changed()
}

/* ==========================================================================
   Was das Gerät selbst meldet
   ========================================================================== */

/**
 * Ist das Handy gar nicht im Netz, weiß es das vor uns.
 *
 * Vorher merkte die App eine Störung erst, wenn ein Aufruf scheiterte, und
 * ohne Frist konnte das ewig dauern. Flugmodus, WLAN weg, Funkloch: Der
 * Browser sagt es sofort, also hören wir zu.
 *
 * Nur der Weg nach „weg" wird hier gegangen. `navigator.onLine` heißt „es
 * gibt eine Verbindung", nicht „unser Server antwortet". Ob er wieder da ist,
 * entscheidet ein Aufruf, der durchkommt, deshalb löst „online" nur ein
 * Nachladen aus.
 */
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('offline', () => verbindungWeg())
  window.addEventListener('online', () => changed())
}

/* Startet die App ohne Netz, kommt kein Ereignis mehr, das sagt es uns. */
if (typeof navigator !== 'undefined' && navigator.onLine === false) {
  offline = true
  seit = Date.now()
}

export const istOffline = () => offline
export const offlineSeit = () => seit

export function beiVerbindungswechsel(f) {
  hoerer.add(f)
  return () => hoerer.delete(f)
}
