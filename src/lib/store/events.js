/**
 * Ein winziger Verteiler: Wer Daten ändert, sagt Bescheid; wer Daten anzeigt,
 * hört zu. Ohne das müsste jede Abfrage pollen.
 */
const listeners = new Set()
let version = 0

export const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const changed = () => {
  version += 1
  listeners.forEach((fn) => fn(version))
}

export const currentVersion = () => version
