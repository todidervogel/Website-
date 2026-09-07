import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useDesignState } from './design-state'
import { useSession } from './session'

/**
 * Zugang zu den Routen und die Schranke vor allen Beiträgen.
 *
 * 1. In der App gibt es keinen Gastmodus: Wer nicht angemeldet ist, landet
 *    auf der Anmeldung — offen bleiben nur Konto-, Rechts- und Fehlerseiten.
 * 2. Auf der Website darf man sich als Gast umsehen, aber nichts beitragen:
 *    liken, folgen, speichern und hochladen fragen erst nach einem Konto.
 * 3. Der Gastro-Bereich gehört Gastro-Konten, der Admin-Bereich Admins.
 */

/** Ohne Anmeldung erreichbar, auch in der App. */
const OPEN_PATHS = [
  '/anmelden', '/registrieren', '/passwort-vergessen', '/passwort-neu',
  '/gastro/anmelden', '/gastro/willkommen', '/gastro/eintragen', '/fuer-gastronomen',
  '/impressum', '/datenschutz', '/agb', '/agb-gastro', '/richtlinien', '/cookies',
  '/uebersicht', '/404', '/500', '/403', '/offline',
]

/** Auf der Website erst nach Anmeldung erreichbar. */
const MEMBER_PATHS = ['/upload', '/einstellungen', '/benachrichtigungen']

const isUnder = (pathname, list) =>
  list.some((p) => pathname === p || pathname.startsWith(`${p}/`))

const AuthGateContext = createContext(null)

export function AuthGateProvider({ children }) {
  const { loggedIn } = useSession()
  const [open, setOpen] = useState(false)

  /**
   * Führt die Aktion aus, wenn jemand angemeldet ist — sonst erscheint der
   * Hinweis, dass dafür ein Konto nötig ist.
   */
  const requireLogin = useCallback(
    (action) => (event) => {
      if (loggedIn) return action?.(event)
      event?.preventDefault?.()
      return setOpen(true)
    },
    [loggedIn],
  )

  const value = useMemo(
    () => ({ requireLogin, gateOpen: open, closeGate: () => setOpen(false), openGate: () => setOpen(true) }),
    [requireLogin, open],
  )

  return <AuthGateContext.Provider value={value}>{children}</AuthGateContext.Provider>
}

export function useAuthGate() {
  const ctx = useContext(AuthGateContext)
  if (!ctx) throw new Error('useAuthGate außerhalb des AuthGateProvider')
  return ctx
}

export function useRequireLogin() {
  return useAuthGate().requireLogin
}

export function RouteGuard({ children }) {
  const { isApp } = useDesignState()
  const { loggedIn, role, mustChangePassword, ready } = useSession()
  const { pathname } = useLocation()

  /*
   * Solange die Sitzung noch geladen wird, gilt niemand als abgemeldet —
   * sonst würde die App beim Start kurz auf die Anmeldeseite springen und
   * die eigentliche Seite ginge verloren.
   */
  if (!ready) return null

  /* Erstes Passwort setzen, bevor der Gastro-Bereich freigegeben wird (F.2). */
  if (loggedIn && mustChangePassword && pathname !== '/gastro/willkommen') {
    return <Navigate to="/gastro/willkommen" replace />
  }

  if (pathname.startsWith('/admin')) {
    if (role !== 'admin') return <Navigate to={loggedIn ? '/403' : '/anmelden'} replace />
    return children
  }

  if (pathname.startsWith('/gastro') && !isUnder(pathname, OPEN_PATHS)) {
    if (role === 'gastro' || role === 'admin') return children
    return <Navigate to={loggedIn ? '/403' : '/gastro/anmelden'} replace />
  }

  if (loggedIn) return children
  if (isUnder(pathname, OPEN_PATHS)) return children
  if (isApp) return <Navigate to="/anmelden" replace />
  if (isUnder(pathname, MEMBER_PATHS)) return <Navigate to="/anmelden" replace />

  return children
}
