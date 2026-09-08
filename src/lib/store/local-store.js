import { createMemoryStore } from '../../domain/store'
import { initialDatabase } from '../../domain/seed'

/**
 * Datenhaltung im Browser.
 *
 * Dieselbe Fachlogik wie auf dem Server, nur mit dem lokalen Speicher
 * darunter. Damit läuft die Website vollständig ohne Server, praktisch zum
 * Ausprobieren und zum Entwickeln an der Oberfläche.
 */
const KEY = 'app-db'
const VERSION = 3

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY))
    if (raw?.version === VERSION && raw.data) return raw.data
  } catch {
    /* Kaputter oder alter Stand, dann eben von vorn. */
  }
  return initialDatabase()
}

const persist = (data) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: VERSION, data }))
  } catch {
    /* Privater Modus oder voller Speicher: Der Stand lebt dann bis zum Neuladen. */
  }
}

export function createLocalStore() {
  const store = createMemoryStore(load(), persist)
  return {
    ...store,
    reset: () => store.replace(initialDatabase()),
  }
}
