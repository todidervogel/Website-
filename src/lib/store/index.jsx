import { useCallback, useEffect, useRef, useState } from 'react'
import { subscribe, currentVersion } from './events'

export { api, api as default, call, MODE, SERVER, resetLocalData, useLocalData, setAccount, getAccount, setToken, getToken, request } from './api'
export { subscribe } from './events'
export { distanceKm, formatDistance, toMapPercent } from '../../domain/geo'
export { DAY_KEYS, dayKeyOf, formatMinutes, formatDay, weekRows, openState, openLabel } from '../../domain/hours'

/**
 * Zählt jede Änderung mit. Abfragen hängen daran und holen sich neue Daten,
 * sobald irgendwo geschrieben wurde — im Alleinbetrieb wie am Server.
 */
export function useDataVersion() {
  const [version, setVersion] = useState(currentVersion)
  useEffect(() => subscribe(setVersion), [])
  return version
}

/**
 * Eine Abfrage.
 *
 *   const { data, loading } = useQuery(() => api.places.list({ radiusKm }), [radiusKm])
 *
 * Beim ersten Aufruf gibt es einen echten Ladezustand. Läuft die Abfrage
 * später wegen einer Änderung erneut, bleibt der alte Inhalt stehen und es
 * wird nur still nachgeladen — sonst würde die Seite bei jedem Klick blinken.
 */
export function useQuery(runner, deps = [], { initial = null, enabled = true } = {}) {
  const version = useDataVersion()
  const [state, setState] = useState({ data: initial, loading: enabled, error: null, refreshing: false })
  const hasData = useRef(false)
  const runnerRef = useRef(runner)
  runnerRef.current = runner

  const run = useCallback(() => {
    if (!enabled) {
      setState({ data: initial, loading: false, error: null, refreshing: false })
      return undefined
    }
    let cancelled = false
    setState((s) => (hasData.current
      ? { ...s, refreshing: true }
      : { data: initial, loading: true, error: null, refreshing: false }))

    Promise.resolve()
      .then(() => runnerRef.current())
      .then((data) => {
        if (cancelled) return
        hasData.current = true
        setState({ data, loading: false, error: null, refreshing: false })
      })
      .catch((error) => {
        if (cancelled) return
        /* Fehlende Rechte sind kein Absturz — die Seite zeigt dann eben nichts. */
        setState({ data: initial, loading: false, error, refreshing: false })
      })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps])

  useEffect(() => run(), [run, version])

  return { ...state, reload: run }
}

/**
 * Eine Änderung. Kümmert sich um den „läuft gerade"-Zustand, damit Buttons
 * währenddessen gesperrt werden können.
 */
export function useMutation(fn, { onSuccess, onError } = {}) {
  const [busy, setBusy] = useState(false)
  const fnRef = useRef(fn)
  fnRef.current = fn

  const run = useCallback(async (...args) => {
    setBusy(true)
    try {
      const result = await fnRef.current(...args)
      onSuccess?.(result)
      return result
    } catch (error) {
      onError?.(error)
      return undefined
    } finally {
      setBusy(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [run, busy]
}
