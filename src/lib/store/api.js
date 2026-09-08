import { hasCall, invoke, listCalls, setStore } from '../../domain'
import { createLocalStore } from './local-store'
import { changed } from './events'
import { verbindungDa, verbindungWeg } from './connection'

/**
 * Der Zugang zur Fachlogik — in zwei Betriebsarten.
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
 *      Server steht, ändert sich öfter — über ngrok bei jedem Start, wenn
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

/** Woher die Adresse stammt — die Einstellungen zeigen es an. */
export const SERVER_QUELLE = gespeicherteAdresse() ? 'geraet' : (import.meta.env?.VITE_API ? 'bau' : 'keiner')

/**
 * Setzt die Serveradresse und lädt neu.
 *
 * Neu laden ist kein Ausweichen, sondern das Richtige: `SERVER` entscheidet
 * beim Laden, ob die Fachlogik im Browser läuft oder über das Netz. Das
 * mitten im Betrieb umzustellen hieße, jeden laufenden Zustand mitzunehmen —
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

/** Sieht nach, ob unter dieser Adresse wirklich unser Server antwortet. */
export async function serverPruefen(adresse) {
  const sauber = String(adresse ?? '').trim().replace(/\/$/, '')
  if (!/^https?:\/\//.test(sauber)) return { ok: false, error: 'Die Adresse muss mit http:// oder https:// anfangen.' }
  try {
    const antwort = await fetch(`${sauber}/api/health`, {
      headers: { 'ngrok-skip-browser-warning': '1' },
      signal: AbortSignal.timeout(8000),
    })
    const daten = await antwort.json()
    if (!daten?.ok) return { ok: false, error: 'Dort antwortet etwas, aber nicht unser Server.' }
    return { ok: true, aufrufe: daten.aufrufe }
  } catch (fehler) {
    return { ok: false, error: `Keine Antwort: ${fehler.message}` }
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

/** Wer gerade angemeldet ist — im Alleinbetrieb prüft die Fachlogik danach. */
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

/** Aufrufe, die schreiben — danach müssen die Abfragen neu laufen. */
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

export async function request(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(`${SERVER}${path}`, {
      method,
      headers: {
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...(getToken() ? { authorization: `Bearer ${getToken()}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (fehler) {
    /*
     * Hier landet alles, was gar nicht erst ankommt: Server aus, WLAN weg,
     * ngrok-Tunnel abgelaufen. Das ist etwas anderes als „der Server sagt
     * nein“ und muss auch anders aussehen.
     */
    verbindungWeg()
    throw Object.assign(new Error('Keine Verbindung'), { offline: true, ursache: fehler })
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
