import { NavLink, useNavigate } from 'react-router-dom'
import { Header, Wordmark } from './Header'
import { useScreen } from './Shell'
import { Avatar, Button } from '../../design/ui'
import { useSession } from '../../lib/session'
import { t } from '../../design/i18n'

/**
 * Rahmen für Gastro-Dashboard (F.4) und Admin (G.1).
 * Desktop: Seitenleiste links (240 px). Mobil: waagerechte Leiste unter der Kopfleiste.
 */
export function ConsolePage({ title, items, base, footerSlot, children, admin, headerSuffix, minimalHeader = true }) {
  useScreen(title)
  return (
    <div className={`app-shell ${admin ? 'admin' : ''}`}>
      <Header suffix={headerSuffix} minimal={minimalHeader} />
      <nav className="console-tabbar" aria-label={t('gastro.nav.overview')}>
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === base} className={({ isActive }) => (isActive ? 'is-active' : '')}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="console">
        <aside className="console-side">
          <nav className="console-nav stack-2" style={{ flex: '1 1 auto' }}>
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === base} className={({ isActive }) => (isActive ? 'is-active' : '')}>
                {item.icon && <item.icon size={18} />}
                {item.label}
              </NavLink>
            ))}
          </nav>
          {footerSlot}
        </aside>
        <main className="console-main">{children}</main>
      </div>
    </div>
  )
}

/** Fuß der Gastro-Seitenleiste: Betriebsname, Vorschaubild, Abmelden. */
export function ConsoleAccount({ name, sub }) {
  const { logout } = useSession()
  const navigate = useNavigate()
  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--sp-3)', marginTop: 'var(--sp-3)' }}>
      <div className="row">
        <Avatar name={name} size={32} />
        <div className="grow">
          <p className="t-small" style={{ fontWeight: 600 }}>{name}</p>
          {sub && <p className="t-small c-secondary truncate">{sub}</p>}
        </div>
      </div>
      <Button variant="quiet" size="sm" onClick={() => { logout(); navigate('/anmelden', { replace: true }) }} style={{ marginTop: 4 }}>
        {t('header.avatarMenu.logout')}
      </Button>
    </div>
  )
}

/** Kopfzeile eines Konsolen-Bereichs: Titel links, Aktionen rechts. */
export function ConsoleHeader({ title, children }) {
  return (
    <div className="row-between" style={{ marginBottom: 'var(--sp-6)', flexWrap: 'wrap' }}>
      <h1 className="t-h1">{title}</h1>
      <div className="row-wrap">{children}</div>
    </div>
  )
}

/** Kennzahlkarte. */
export function Kpi({ label, value, sub, change, children }) {
  return (
    <div className="card">
      <p className="t-small c-secondary">{label}</p>
      <p className="kpi-value">{value}</p>
      {children}
      <p className="t-small c-secondary">
        {sub}
        {change && <span className="c-success" style={{ marginLeft: 6, fontWeight: 600 }}>{change}</span>}
      </p>
    </div>
  )
}
