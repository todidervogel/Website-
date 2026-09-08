import { NavLink } from 'react-router-dom'
import { MapPin, Plus, Search, SquarePlay, User } from 'lucide-react'
import { useDesignState } from '../../lib/design-state'
import { useSession } from '../../lib/session'
import { t } from '../../design/i18n'

/**
 * TEIL B.3 — Untere Navigationsleiste, nur auf schmalen Bildschirmen.
 *
 *   App     fünf Punkte, „Aufnehmen“ mittig und hervorgehoben
 *   Website vier Punkte ohne „Aufnehmen“ — Videos aufnehmen gehört zur App,
 *           nicht auf eine Internetseite
 *
 * Am Rechner erscheint die Leiste gar nicht; dort führt die Kopfleiste (B.1/B.2).
 * In der reinen Kartenansicht verschwindet sie ebenfalls.
 *
 * Die Beschriftungen stehen in gewöhnlicher Schreibweise („Feed"), nicht in
 * Großbuchstaben mit Sperrung. Das war vorher `.t-tiny` — eine Auszeichnung
 * für Tabellenköpfe. Kein Telefon beschriftet seine Leiste so.
 */
export function BottomNav({ dark }) {
  const { isApp, isDesktop, pureMap } = useDesignState()
  const { loggedIn } = useSession()

  if (isDesktop || pureMap) return null

  const active = ({ isActive }) => (isActive ? 'is-active' : '')

  return (
    <nav className={`bottom-nav ${dark ? 'bottom-nav-dark' : ''}`} aria-label={t('bottomNav.mainLabel')}>
      <NavLink to="/feed" className={active}>
        <SquarePlay size={22} />
        <span className="nav-label">{t('bottomNav.feed')}</span>
      </NavLink>
      <NavLink to="/karte" className={active}>
        <MapPin size={22} />
        <span className="nav-label">{t('bottomNav.map')}</span>
      </NavLink>

      {/* Auch auf der Webseite — aber nur angemeldet. */}
      {(isApp || loggedIn) && (
        <NavLink to="/upload" className={active}>
          <span className="nav-capture"><Plus size={22} /></span>
          <span className="nav-label">{t('bottomNav.capture')}</span>
        </NavLink>
      )}

      <NavLink to="/suche" className={active}>
        <Search size={22} />
        <span className="nav-label">{t('bottomNav.search')}</span>
      </NavLink>
      <NavLink to="/profil" className={active}>
        <User size={22} />
        <span className="nav-label">{t('bottomNav.profile')}</span>
      </NavLink>
    </nav>
  )
}
