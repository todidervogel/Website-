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

  /** Registrierung Schritt 1 — das Konto entsteht erst nach dem Code (D.2). */
  const startRegistration = useCallback(async (data) => {
    if (!SERVER) {
      useLocalData()
      const free = domain.auth.canRegister(data)
      if (!free.ok) return { ok: false, error: errorText(free.error) }
    }
    /* Der Code steht im Testbetrieb fest — echte SMS gibt es hier nicht. */
    setPending({ ...data, code: '123456' })
    return { ok: true }
  }, [])

  const confirmRegistration = useCallback(async (code) => {
    if (!pending) return { ok: false, error: errorText('noPendingRegistration') }
    if (code.replace(/\s/g, '') !== pending.code) return { ok: false, error: errorText('wrongCode') }

    if (SERVER) {
      try {
        const data = await request('/api/auth/register', { method: 'POST', body: pending })
        setToken(data.token)
        const me = await request('/api/auth/me')
        setLocalAccount(me.account)
        setPending(null)
        return { ok: true, user: data.user }
      } catch (error) {
        return { ok: false, error: errorText(error.message) }
      }
    }

    const result = domain.auth.register(pending)
    if (!result.ok) return { ok: false, error: errorText(result.error) }
    setPending(null)
    setLocalAccount(domain.auth.accountOf(result.user.id))
    changed()
    return result
  }, [pending])

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
    ready,
    login, logout, startRegistration, confirmRegistration, changePassword, updateMe,
  }), [account, pending, ready, login, logout, startRegistration, confirmRegistration, changePassword, updateMe])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession außerhalb des SessionProvider')
  return ctx
}
