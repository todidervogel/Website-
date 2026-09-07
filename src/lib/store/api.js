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

export const SERVER = (import.meta.env?.VITE_API ?? '').replace(/\/$/, '')
export const MODE = SERVER ? 'server' : 'lokal'

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
