import { NavLink } from 'react-router-dom'
import { MapPin, Plus, Search, SquarePlay, User } from 'lucide-react'
import { useDesignState } from '../../lib/design-state'
import { useSession } from '../../lib/session'
import { t } from '../../design/i18n'

/**
 * TEIL B.3, Untere Navigationsleiste, nur auf schmalen Bildschirmen.
 *
 *   App     fünf Punkte, „Aufnehmen“ mittig und hervorgehoben
 *   Website vier Punkte ohne „Aufnehmen“, Videos aufnehmen gehört zur App,
 *           nicht auf eine Internetseite
 *
 * Am Rechner erscheint die Leiste gar nicht; dort führt die Kopfleiste (B.1/B.2).
 * In der reinen Kartenansicht verschwindet sie ebenfalls.
 *
 * Die Beschriftungen stehen in gewöhnlicher Schreibweise („Feed"), nicht in
 * Großbuchstaben mit Sperrung. Das war vorher `.t-tiny`, eine Auszeichnung
 * für Tabellenköpfe. Kein Telefon beschriftet seine Leiste so.
 *
 * ── Warum die Leistenpunkte `replace` benutzen ────────────────────────────
 *
 * Ein Wechsel zwischen den Hauptbereichen ist kein Schritt vorwärts, sondern
 * ein Wechsel des Ortes. Vorher legte jeder Tipp einen Verlaufseintrag an:
 * Wer viermal zwischen Feed und Karte wechselte, musste viermal Zurück
 * drücken, um aus der App zu kommen. Gemessen, nicht vermutet.
 *
 * Mit `replace` bleibt immer genau ein Eintrag für den aktuellen Bereich
 * stehen, und was man darin öffnet (eine Betriebsseite, ein Video) legt sich
 * darüber. Zurück führt dann dorthin zurück und beim nächsten Mal aus der App
 * heraus. So verhalten sich alle Apps mit einer Leiste unten.
 *
 * **Aufnehmen ist ausgenommen.** Der Upload ist ein Ablauf über mehrere
 * Schritte, kein Ort. Wer ihn abbricht, will dorthin zurück, wo er herkam.
 */
export function BottomNav({ dark }) {
  const { isApp, isDesktop, pureMap } = useDesignState()
  const { loggedIn } = useSession()

  if (isDesktop || pureMap) return null

  const active = ({ isActive }) => (isActive ? 'is-active' : '')

  return (
    <nav className={`bottom-nav ${dark ? 'bottom-nav-dark' : ''}`} aria-label={t('bottomNav.mainLabel')}>
      <NavLink to="/feed" className={active} replace>
        <SquarePlay size={22} />
        <span className="nav-label">{t('bottomNav.feed')}</span>
      </NavLink>
      <NavLink to="/karte" className={active} replace>
        <MapPin size={22} />
        <span className="nav-label">{t('bottomNav.map')}</span>
      </NavLink>

      {/* Auch auf der Webseite, aber nur angemeldet. */}
      {(isApp || loggedIn) && (
        <NavLink to="/upload" className={active}>
          <span className="nav-capture"><Plus size={22} /></span>
          <span className="nav-label">{t('bottomNav.capture')}</span>
        </NavLink>
      )}

      <NavLink to="/suche" className={active} replace>
        <Search size={22} />
        <span className="nav-label">{t('bottomNav.search')}</span>
      </NavLink>
      <NavLink to="/profil" className={active} replace>
        <User size={22} />
        <span className="nav-label">{t('bottomNav.profile')}</span>
      </NavLink>
    </nav>
  )
}
