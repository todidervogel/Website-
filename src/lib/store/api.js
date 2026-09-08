import { hasCall, invoke, listCalls, setStore } from '../../domain'
import { createLocalStore } from './local-store'
import { changed } from './events'
import { istOffline, verbindungDa, verbindungWeg } from './connection'

/**
 * Der Zugang zur Fachlogik, in zwei Betriebsarten.
 *
 *   ohne VITE_API   alles im Browser. Die Fachlogik aus src/domain läuft
 *                   direkt, die Daten liegen im lokalen Speicher. Zum
 *                   Ausprobieren und zum Arbeiten an der Oberfläche.
 *
 *   mit  VITE_API   jeder Aufruf geht an den Server. Dann teilen sich alle
 *                   Geräte denselben Stand, und die Rechte hängen dort.
 *
 * Nach außen sieht beides gleich aus: `api.places.list({…})` gibt ein
 * Versprechen zurück. Die Screens merken nicht, welche Betriebsart läuft.
 */

/**
 * Die Adresse des Servers.
 *
 * Zwei Wege, absichtlich in dieser Reihenfolge:
 *
 *   1. Was im Gerät eingestellt ist. Die App wird einmal gebaut; wo ihr
 *      Server steht, ändert sich öfter, über ngrok bei jedem Start, wenn
 *      keine feste Adresse hinterlegt ist. Für jede neue Adresse eine neue
 *      APK zu bauen, wäre unzumutbar, wenn man nur ein Handy hat.
 *   2. `VITE_API` beim Bauen. Das bleibt für die Webseite und für den Fall,
 *      dass die Adresse feststeht.
 *
 * Ist beides leer, läuft alles im Browser (Alleinbetrieb).
 */
const SPEICHER_SCHLUESSEL = 'api-adresse'

const gespeicherteAdresse = () => {
  try { return localStorage.getItem(SPEICHER_SCHLUESSEL) ?? '' } catch { return '' }
}

export const SERVER = (gespeicherteAdresse() || import.meta.env?.VITE_API || '').replace(/\/$/, '')
export const MODE = SERVER ? 'server' : 'lokal'

/** Woher die Adresse stammt, die Einstellungen zeigen es an. */
export const SERVER_QUELLE = gespeicherteAdresse() ? 'geraet' : (import.meta.env?.VITE_API ? 'bau' : 'keiner')

/**
 * Setzt die Serveradresse und lädt neu.
 *
 * Neu laden ist kein Ausweichen, sondern das Richtige: `SERVER` entscheidet
 * beim Laden, ob die Fachlogik im Browser läuft oder über das Netz. Das
 * mitten im Betrieb umzustellen hieße, jeden laufenden Zustand mitzunehmen,
 * Anmeldung, Zwischenspeicher, offene Abfragen. Ein Neustart der Seite ist
 * eine Sekunde und danach stimmt alles.
 */
export function setServerAdresse(adresse) {
  const sauber = String(adresse ?? '').trim().replace(/\/$/, '')
  try {
    if (sauber) localStorage.setItem(SPEICHER_SCHLUESSEL, sauber)
    else localStorage.removeItem(SPEICHER_SCHLUESSEL)
  } catch {
    return { ok: false, error: 'Der Speicher des Browsers ist nicht verfügbar.' }
  }
  window.location.reload()
  return { ok: true }
}

/* ==========================================================================
   Jeder Aufruf bekommt eine Frist
   ========================================================================== */

/**
 * Wie lange auf den Server gewartet wird, bevor er als weg gilt.
 *
 * ┌─ Warum es das gibt ──────────────────────────────────────────────────────┐
 * │  Ohne Frist wartet `fetch` unbegrenzt. Gemessen: Zeigt die App auf eine  │
 * │  Adresse, die die Verbindung annimmt und dann nie antwortet (toter       │
 * │  ngrok-Tunnel, WLAN mit Anmeldeseite, Funkloch mitten im Aufbau), dann   │
 * │  dreht sich der Anmelde-Knopf für immer. Kein Fehler, keine Meldung,     │
 * │  nichts. Genau so kam es auf dem Handy an: „Ich drücke auf Anmelden und  │
 * │  es passiert nichts."                                                    │
 * │                                                                          │
 * │  Dasselbe traf das Verbindungsband: Es fragt beim Start `/api/health`.   │
 * │  Hängt dieser Aufruf, erscheint das Band nie, und deshalb fehlte auch    │
 * │  die Meldung, dass der Server nicht erreichbar ist.                      │
 * └──────────────────────────────────────────────────────────────────────────┘
 */
const FRIST = 15000

/** Kurze Frist für die Nachfragen, die nur „lebst du?" bedeuten. */
export const FRIST_PROBE = 8000

/** Lange Frist, wenn wirklich Daten hochgehen (Videos, Bilder). */
const FRIST_GROSS = 60000

/** Ab dieser Rumpfgröße gilt ein Aufruf als Hochladen. */
const GROSS_AB = 100000

/**
 * Baut ein Abbruchsignal mit Uhr.
 *
 * Von Hand und nicht mit `AbortSignal.timeout`: Das gibt es erst in neueren
 * Browsern, und die App läuft auch auf Geräten, deren WebView älter ist. Ein
 * fehlendes `AbortSignal.timeout` wäre dort ein Fehler mitten im Aufruf, also
 * genau die Stille, die wir gerade abstellen.
 */
function zeitwaechter(ms) {
  const steuerung = new AbortController()
  const uhr = setTimeout(() => steuerung.abort(), ms)
  return { signal: steuerung.signal, fertig: () => clearTimeout(uhr) }
}

/** Ein Abbruch durch die Uhr sieht aus wie jeder andere Abbruch. */
const istAbbruch = (fehler) => fehler?.name === 'AbortError' || fehler?.name === 'TimeoutError'

/**
 * Wo der Server seine aktuelle Adresse hinterlegt.
 *
 * ┌─ Woran das hängt ────────────────────────────────────────────────────────┐
 * │  Server/adresse.json                    wird bei jedem Lauf geschrieben  │
 * │  Server/.github/adresse-hochladen.sh    schreibt sie                     │
 * │  Server/docs/ADRESSE.md                 erklärt das Format               │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Über ngrok bekommt der Server bei jedem Start eine neue Adresse, wenn keine
 * feste hinterlegt ist. Sie jedes Mal abzutippen ist auf einem Handy eine
 * Zumutung, und eine tote Adresse fest in der APK wäre schlechter als keine.
 * Also fragt die App nach.
 */
const ADRESSVERZEICHNIS = 'https://raw.githubusercontent.com/todidervogel/Server/main/adresse.json'

/**
 * Holt die zuletzt veröffentlichte Serveradresse.
 *
 * Gibt immer ein Ergebnis mit `grund` zurück, nie einen Fehler: Die
 * Oberfläche soll sagen können, **warum** es nicht ging.
 *
 *   'gefunden'   es läuft einer, `adresse` steht drin
 *   'beendet'    der letzte Lauf ist vorbei
 *   'keiner'     es wurde noch nie einer veröffentlicht
 *   'fehler'     das Verzeichnis war nicht erreichbar
 */
export async function adresseHolen() {
  const wache = zeitwaechter(FRIST_PROBE)
  try {
    const antwort = await fetch(`${ADRESSVERZEICHNIS}?t=${Date.now()}`, {
      cache: 'no-store',
      signal: wache.signal,
    })
    if (!antwort.ok) return { grund: 'fehler' }

    const daten = await antwort.json()
    if (!daten.adresse) return { grund: 'keiner' }
    if (daten.beendet) return { grund: 'beendet', adresse: daten.adresse, lauf: daten.lauf }
    return { grund: 'gefunden', adresse: daten.adresse.replace(/\/$/, ''), laeuftBis: daten.laeuftBis }
  } catch {
    return { grund: 'fehler' }
  } finally {
    wache.fertig()
  }
}

/** Sieht nach, ob unter dieser Adresse wirklich unser Server antwortet. */
export async function serverPruefen(adresse) {
  const sauber = String(adresse ?? '').trim().replace(/\/$/, '')
  if (!/^https?:\/\//.test(sauber)) return { ok: false, error: 'Die Adresse muss mit http:// oder https:// anfangen.' }
  const wache = zeitwaechter(FRIST_PROBE)
  try {
    const antwort = await fetch(`${sauber}/api/health`, {
      headers: { 'ngrok-skip-browser-warning': '1' },
      signal: wache.signal,
    })
    const daten = await antwort.json()
    if (!daten?.ok) return { ok: false, error: 'Dort antwortet etwas, aber nicht unser Server.' }
    return { ok: true, aufrufe: daten.aufrufe }
  } catch (fehler) {
    /* Ein Abbruch durch die Uhr heißt: Die Adresse nimmt an und schweigt. */
    if (istAbbruch(fehler)) return { ok: false, error: 'Dort antwortet niemand.' }
    return { ok: false, error: `Keine Antwort: ${fehler.message}` }
  } finally {
    wache.fertig()
  }
}

/* ==========================================================================
   Alleinbetrieb
   ========================================================================== */
let localStore = null
let account = null

export function useLocalData() {
  if (!localStore) {
    localStore = createLocalStore()
    setStore(localStore)
  }
  return localStore
}

/** Wer gerade angemeldet ist, im Alleinbetrieb prüft die Fachlogik danach. */
export function setAccount(next) {
  account = next
}

export function getAccount() {
  return account
}

export function resetLocalData() {
  useLocalData().reset()
  changed()
}

/** Aufrufe, die schreiben, danach müssen die Abfragen neu laufen. */
const WRITES = /^(social|reviews\.(create|answer|like)|videos\.(create|moderate|setVisibility|remove|markSeen)|menu\.(add|update|remove|move)|places\.(save|setStatus)|users\.(save|setStatus|deleteAccount)|notifications\.markAllRead|reports\.(create|resolve)|admin\.(create|resend|resolve|setClaim|suggest|request)|search\.(remember|clearHistory))/

function invokeLocally(method, args) {
  useLocalData()
  const { status, body } = invoke(method, args, account)
  if (status >= 400) throw Object.assign(new Error(body.error), { status, method })
  if (WRITES.test(method)) changed()
  return body.result
}

/* ==========================================================================
   Serverbetrieb
   ========================================================================== */
let token = null

export function setToken(next) {
  token = next
  try {
    if (next) localStorage.setItem('app-token', next)
    else localStorage.removeItem('app-token')
  } catch {
    /* Ohne Speicher endet die Sitzung beim Neuladen. */
  }
}

export function getToken() {
  if (token) return token
  try { token = localStorage.getItem('app-token') } catch { token = null }
  return token
}

export async function request(path, { method = 'GET', body, frist } = {}) {
  const rumpf = body ? JSON.stringify(body) : undefined

  /*
   * Wer wirklich etwas hochlädt, bekommt mehr Zeit. Ein Video als Datenstrom
   * über eine Handyverbindung braucht länger als jede Abfrage, und eine Frist,
   * die genau dabei zuschlägt, wäre schlimmer als keine.
   */
  const wache = zeitwaechter(frist ?? (
    /* Steht die Störung schon fest, muss der nächste Versuch nicht wieder die
       volle Frist ausreizen. Zwei Minuten Warten für dieselbe Auskunft wäre
       Schikane. */
    istOffline() ? FRIST_PROBE
      : rumpf && rumpf.length > GROSS_AB ? FRIST_GROSS
        : FRIST
  ))

  try {
    let res
    try {
      res = await fetch(`${SERVER}${path}`, {
        method,
        headers: {
          /*
           * Ein kostenloser ngrok-Tunnel schiebt Browsern eine Warnseite
           * dazwischen. Die kommt mit Status 200 und HTML, sieht für den Code
           * also aus wie eine Antwort, ist aber keine: `res.json()` scheitert,
           * und die Anmeldung bekäme ein leeres Ergebnis statt eines
           * Zugangsmerkmals. Diese Kopfzeile überspringt die Seite. Der Server
           * gibt sie in src/http/server.js frei, sonst lässt der Browser sie
           * bei der Voranfrage nicht durch.
           */
          'ngrok-skip-browser-warning': '1',
          ...(body ? { 'content-type': 'application/json' } : {}),
          ...(getToken() ? { authorization: `Bearer ${getToken()}` } : {}),
        },
        body: rumpf,
        signal: wache.signal,
      })
    } catch (fehler) {
      /*
       * Hier landet alles, was gar nicht erst ankommt: Server aus, WLAN weg,
       * ngrok-Tunnel abgelaufen, und seit der Frist auch der Fall, dass die
       * Gegenstelle annimmt und dann schweigt. Das ist etwas anderes als
       * „der Server sagt nein“ und muss auch anders aussehen.
       */
      verbindungWeg()
      throw Object.assign(
        new Error(istAbbruch(fehler) ? 'Zeitüberschreitung' : 'Keine Verbindung'),
        { offline: true, ursache: fehler },
      )
    }

    /* Ein Server, der mit 5xx antwortet, ist auch nicht benutzbar. */
    if (res.status >= 500) {
      verbindungWeg()
      throw Object.assign(new Error(`HTTP ${res.status}`), { offline: true, status: res.status })
    }

    verbindungDa()

    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw Object.assign(new Error(data.error ?? `HTTP ${res.status}`), { status: res.status })
    return data
  } finally {
    /* Auch der Rumpf hängt an diesem Signal, deshalb erst ganz am Ende. */
    wache.fertig()
  }
}

async function invokeRemotely(method, args) {
  const data = await request('/api/rpc', { method: 'POST', body: { method, args } })
  if (WRITES.test(method)) changed()
  return data.result
}

/* ==========================================================================
   Ein Zugang für beide Wege
   ========================================================================== */
export async function call(method, args = []) {
  if (!hasCall(method)) throw new Error(`Unbekannter Aufruf: ${method}`)
  if (SERVER) return invokeRemotely(method, args)
  return invokeLocally(method, args)
}

/** Baut aus der Aufrufliste ein Objekt: api.places.list(…) und so weiter. */
function buildApi() {
  const out = {}
  for (const { name } of listCalls()) {
    const [area, method] = name.split('.')
    out[area] ??= {}
    out[area][method] = (...args) => call(name, args)
  }
  return out
}

export const api = buildApi()
export default api
