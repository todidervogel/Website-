import { NavLink } from 'react-router-dom'
import { MapPin, Plus, Search, SquarePlay, User } from 'lucide-react'
import { useDesignState } from '../../lib/design-state'
import { useSession } from '../../lib/session'
import { t } from '../../design/i18n'

/**
 * Navigation am Rechner — die Entsprechung zur unteren Leiste (B.3).
 *
 * Warum nicht einfach die untere Leiste breiter machen: Eine Leiste am
 * unteren Rand ist für den Daumen gedacht. Am Rechner ist dort niemand.
 * Die Maus ist links oben zu Hause, und senkrecht ist Platz für
 * Beschriftungen, die auf dem Handy nicht hinpassen.
 *
 * Unter 1024px zeigt sie sich nicht (CSS), dort führt die untere Leiste.
 */
export function SideNav({ dark }) {
  const { isApp } = useDesignState()
  const { loggedIn } = useSession()
  const active = ({ isActive }) => (isActive ? 'is-active' : '')

  const Punkt = ({ to, icon: Icon, children, className = '' }) => (
    <NavLink to={to} className={({ isActive }) => `${active({ isActive })} ${className}`.trim()}>
      <Icon size={22} />
      <span className="side-nav-label">{children}</span>
    </NavLink>
  )

  return (
    <nav className={`side-nav ${dark ? 'side-nav-dark' : ''}`} aria-label={t('bottomNav.mainLabel')}>
      <Punkt to="/feed" icon={SquarePlay}>{t('bottomNav.feed')}</Punkt>
      <Punkt to="/karte" icon={MapPin}>{t('bottomNav.map')}</Punkt>
      <Punkt to="/suche" icon={Search}>{t('bottomNav.search')}</Punkt>

      {/*
        * Hochladen geht auch auf der Webseite — nur angemeldet. Vorher war der
        * Punkt der App vorbehalten; wer am Rechner eine Bewertung schreiben
        * wollte, fand keinen Weg dorthin.
        */}
      {(isApp || loggedIn) && (
        <Punkt to="/upload" icon={Plus} className="side-nav-capture">{t('bottomNav.capture')}</Punkt>
      )}
      <Punkt to="/profil" icon={User}>{t('bottomNav.profile')}</Punkt>
    </nav>
  )
}
