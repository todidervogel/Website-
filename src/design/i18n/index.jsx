import de from './de.json'
import { APP_NAME } from '../config'

/**
 * Minimaler Übersetzungs-Helper.
 *
 * t('home.title')                      → Text aus de.json
 * t('search.emptyTitle', { query: 'x' }) → {{query}} wird ersetzt
 *
 * {{app}} ist immer verfügbar und wird mit APP_NAME gefüllt.
 * Fehlt ein Schlüssel, wird der Schlüssel selbst zurückgegeben, so fällt
 * eine Lücke in de.json im Design sofort auf.
 */
const dict = de

export function t(key, vars) {
  const raw = key.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), dict)
  if (typeof raw !== 'string') {
    if (import.meta.env?.DEV) console.warn(`[i18n] Fehlender Schlüssel: ${key}`)
    return key
  }
  return interpolate(raw, vars)
}

export function interpolate(text, vars) {
  const all = { app: APP_NAME, ...vars }
  return text.replace(/\{\{(\w+)\}\}/g, (match, name) =>
    all[name] != null ? String(all[name]) : match,
  )
}

/**
 * Wie t(), aber mit Platzhaltern, die React-Knoten sein dürfen
 * (z. B. Links in Kästchen-Texten). Gibt ein Array zurück.
 */
export function tNodes(key, nodes) {
  const raw = key.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), dict)
  if (typeof raw !== 'string') return [key]
  const withApp = raw.replace(/\{\{app\}\}/g, APP_NAME)
  return withApp.split(/(\{\{\w+\}\})/g).map((part, i) => {
    const match = part.match(/^\{\{(\w+)\}\}$/)
    if (!match) return part
    const node = nodes?.[match[1]]
    return node == null ? part : <span key={i}>{node}</span>
  })
}

/** „Zu zweit", „Zu dritt", …, sonst „Zu 8". */
export function groupSizeLabel(size) {
  if (size == null) return ''
  const named = dict.place?.groupSizes?.[String(size)]
  return named ?? t('place.groupSizeMany', { size })
}

export default t
