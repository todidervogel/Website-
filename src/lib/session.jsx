import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, getToken, request, setAccount, setToken, SERVER, useLocalData } from './store'
import { changed, subscribe } from './store/events'
import * as domain from '../domain'
import { t } from '../design/i18n'

/**
 * Anmeldung und Sitzung — in beiden Betriebsarten.
 *
 *   Alleinbetrieb  geprüft wird gegen die Daten im Browser
 *   Serverbetrieb  geprüft wird auf dem Server, zurück kommt ein Zugangsmerkmal
 *
 * Nach außen ist das gleich: `login()`, `logout()`, `user`, `role`.
 */

const KEY = 'app-session'
const SessionContext = createContext(null)

const readStored = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}

const writeStored = (value) => {
  try {
    if (value) localStorage.setItem(KEY, JSON.stringify(value))
    else localStorage.removeItem(KEY)
  } catch {
    /* Ohne Speicher endet die Sitzung beim Neuladen. */
  }
}

/** Fehlerschlüssel vom Server in einen deutschen Satz übersetzen. */
const errorText = (key) => t(`auth.errors.${key}`)

export function SessionProvider({ children }) {
  const [account, setLocalAccount] = useState(null)
  const [ready, setReady] = useState(false)
  /* Zwischenschritt der Registrierung (D.1 → D.2). */
  const [pending, setPending] = useState(null)
  const [, force] = useState(0)

  useEffect(() => subscribe(() => force((n) => n + 1)), [])

  /* Beim Start die vorhandene Sitzung wiederherstellen. */
  useEffect(() => {
    let cancelled = false

    const restore = async () => {
      if (SERVER) {
        if (!getToken()) { setReady(true); return }
        try {
          const data = await request('/api/auth/me')
          if (!cancelled) setLocalAccount(data.account)
        } catch {
          setToken(null)
        }
      } else {
        useLocalData()
        const stored = readStored()
        const found = stored?.userId ? domain.auth.accountOf(stored.userId) : null
        if (!cancelled) setLocalAccount(found)
      }
      if (!cancelled) setReady(true)
    }

    restore()
    return () => { cancelled = true }
  }, [])

  /* Die Fachlogik im Alleinbetrieb muss wissen, wer angemeldet ist. */
  useEffect(() => {
    if (!SERVER) setAccount(account)
    writeStored(account ? { userId: account.id } : null)
  }, [account])

  const login = useCallback(async (identifier, password) => {
    if (SERVER) {
      try {
        const data = await request('/api/auth/login', { method: 'POST', body: { identifier, password } })
        setToken(data.token)
        const me = await request('/api/auth/me')
        setLocalAccount(me.account)
        return { ok: true, user: data.user, mustChangePassword: data.mustChangePassword }
      } catch (error) {
        return { ok: false, error: errorText(error.message) }
      }
    }

    useLocalData()
    const result = domain.auth.login(identifier, password)
    if (!result.ok) return { ok: false, error: errorText(result.error) }
    setLocalAccount(domain.auth.accountOf(result.user.id))
    return result
  }, [])

  const logout = useCallback(async () => {
    if (SERVER) {
      try { await request('/api/auth/logout', { method: 'POST' }) } catch { /* egal */ }
      setToken(null)
    }
    setLocalAccount(null)
    setPending(null)
    changed()
  }, [])

  /** Registrierung Schritt 1 — das Konto entsteht erst nach Schritt 2 (D.1). */
  const startRegistration = useCallback(async (data) => {
    if (!SERVER) {
      useLocalData()
      const free = domain.auth.canRegister(data)
      if (!free.ok) return { ok: false, error: errorText(free.error) }
    }
    /*
     * Der Code steht fest, weil im MVP niemand eine SMS verschickt. Genau
     * deshalb gibt es auf dem nächsten Bildschirm einen Knopf zum
     * Überspringen — siehe `skipVerification` weiter unten.
     */
    setPending({ ...data, code: '123456' })
    return { ok: true }
  }, [])

  /**
   * Legt das Konto wirklich an — der Schritt, den beide Wege gemeinsam haben:
   * bestätigen und überspringen.
   *
   * @param ueberspringen  hält am Konto fest, dass ohne Bestätigung
   *                       weitergegangen wurde (src/domain/auth.js)
   */
  const kontoAnlegen = useCallback(async (daten, { ueberspringen = false } = {}) => {
    if (SERVER) {
      try {
        const antwort = await request('/api/auth/register', { method: 'POST', body: daten })
        setToken(antwort.token)
        if (ueberspringen) {
          /* Scheitert das, ist das Konto trotzdem da — nur der Vermerk fehlt. */
          try { await api.auth.skipVerification() } catch { /* nicht der Rede wert */ }
        }
        const me = await request('/api/auth/me')
        setLocalAccount(me.account)
        setPending(null)
        return { ok: true, user: antwort.user }
      } catch (error) {
        return { ok: false, error: errorText(error.message) }
      }
    }

    useLocalData()
    const ergebnis = domain.auth.register(daten)
    if (!ergebnis.ok) return { ok: false, error: errorText(ergebnis.error) }
    /*
     * Direkt über die Fachlogik, nicht über `api`: Wer angemeldet ist, erfährt
     * der Alleinbetrieb erst im nächsten Durchlauf (setAccount steckt in einem
     * useEffect). Ein Aufruf hier würde deshalb noch ohne Konto ankommen.
     */
    if (ueberspringen) domain.auth.skipVerification(ergebnis.user.id)
    setPending(null)
    setLocalAccount(domain.auth.accountOf(ergebnis.user.id))
    changed()
    return ergebnis
  }, [])

  const confirmRegistration = useCallback(async (code) => {
    if (!pending) return { ok: false, error: errorText('noPendingRegistration') }
    if (code.replace(/\s/g, '') !== pending.code) return { ok: false, error: errorText('wrongCode') }
    return kontoAnlegen(pending)
  }, [pending, kontoAnlegen])

  /**
   * Bestätigung überspringen.
   *
   * Solange es weder SMS- noch Mailversand gibt, wäre eine Pflicht zur
   * Bestätigung eine Tür ohne Schlüssel: Niemand bekäme je einen Code, und
   * niemand käme je zu einem Konto. Das Konto entsteht also auch so — der
   * offene Punkt bleibt am Konto stehen und lässt sich später nachholen.
   */
  const skipVerification = useCallback(async () => {
    if (!pending) return { ok: false, error: errorText('noPendingRegistration') }
    return kontoAnlegen(pending, { ueberspringen: true })
  }, [pending, kontoAnlegen])

  const changePassword = useCallback(async (password) => {
    if (!account) return { ok: false }
    if (SERVER) {
      await request('/api/auth/password', { method: 'POST', body: { password } })
    } else {
      domain.auth.changePassword(account.id, password)
    }
    setLocalAccount((a) => (a ? { ...a, mustChangePassword: false } : a))
    changed()
    return { ok: true }
  }, [account])

  const updateMe = useCallback(async (changes) => {
    if (!account) return
    await api.users.save(null, changes)
    setLocalAccount((a) => ({ ...a, ...changes }))
  }, [account])


  const value = useMemo(() => ({
    user: account,
    userId: account?.id ?? null,
    loggedIn: !!account,
    role: account?.role ?? 'guest',
    isGastro: account?.role === 'gastro',
    isAdmin: account?.role === 'admin',
    placeId: account?.placeId ?? null,
    mustChangePassword: !!account?.mustChangePassword,
    pendingRegistration: pending,
    /* Offene Bestätigungen — die Einstellungen weisen darauf hin. */
    emailVerified: account?.emailVerified !== false,
    phoneVerified: account?.phoneVerified !== false,
    ready,
    login, logout, startRegistration, confirmRegistration, skipVerification, changePassword, updateMe,
  }), [account, pending, ready, login, logout, startRegistration, confirmRegistration, skipVerification, changePassword, updateMe])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession außerhalb des SessionProvider')
  return ctx
}
