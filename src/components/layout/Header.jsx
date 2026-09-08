import { Link, useNavigate } from 'react-router-dom'
import {
  Bell, Bookmark, CircleHelp, LogIn, LogOut, MapPin, Menu as MenuIcon, Search,
  Settings, SquarePlay, Store, User, UserPlus,
} from 'lucide-react'
import { Avatar, Button, IconButton, Menu, MenuItem, MenuSeparator } from '../../design/ui'
import { ThemeToggle } from './ThemeToggle'
import { useSession } from '../../lib/session'
import { api, useQuery } from '../../lib/store'
import { APP_NAME } from '../../design/config'
import { t } from '../../design/i18n'

/** Wortmarke, zieht den Produktnamen aus der zentralen Konstante. */
export function Wordmark({ suffix, to = '/' }) {
  return (
    <Link to={to} className="wordmark">
      {APP_NAME}
      {suffix && <span className="wordmark-suffix"> {suffix}</span>}
    </Link>
  )
}

/**
 * TEIL B.1 / B.2, Kopfleiste Web.
 * Nicht eingeloggt: Suchfeld, „Für Gastronomen“, Anmelden, Registrieren.
 * Eingeloggt: Suchfeld, Glocke, Avatar mit Aufklappmenü.
 */
export function Header({ suffix, minimal }) {
  const { user, loggedIn, logout } = useSession()
  const { data: unread } = useQuery(
    () => api.notifications.unreadCount(),
    [user?.id],
    { initial: 0, enabled: loggedIn },
  )
  const navigate = useNavigate()

  const signOut = () => { logout(); navigate('/anmelden', { replace: true }) }

  return (
    <header className="header">
      <div className="container header-inner">
        <Wordmark suffix={suffix} />

        {minimal && <span className="header-actions"><ThemeToggle /></span>}

        {!minimal && (
          <>
            <form
              className="header-search only-desktop"
              onSubmit={(e) => { e.preventDefault(); navigate('/suche') }}
              role="search"
            >
              <Search size={18} className="search-icon" />
              <input className="input" type="search" placeholder={t('header.searchPlaceholder')} aria-label={t('common.search')} />
            </form>

            <div className="header-actions">
              {/* Mobil: Suchsymbol, Darstellung und Hamburger-Menü */}
              <span className="only-mobile row" style={{ gap: 0 }}>
                <IconButton icon={Search} label={t('common.search')} to="/suche" />
                <ThemeToggle />
                <Menu
                  align="right"
                  trigger={({ toggle }) => <IconButton icon={MenuIcon} label={t('header.menu')} onClick={toggle} />}
                >
                  {({ close }) => (
                    <>
                      {/*
                        * Jeder Eintrag mit Symbol. Ein Menü aus reinem Text
                        * liest man Zeile für Zeile; mit Symbol trifft man den
                        * richtigen Punkt schon beim Hinsehen. So machen es
                        * Instagram und TikTok auch.
                        */}
                      <MenuItem icon={MapPin} onClick={() => { close(); navigate('/karte') }}>{t('footer.map')}</MenuItem>
                      <MenuItem icon={SquarePlay} onClick={() => { close(); navigate('/feed') }}>{t('footer.feed')}</MenuItem>
                      <MenuItem icon={Store} onClick={() => { close(); navigate('/fuer-gastronomen') }}>{t('header.forRestaurants')}</MenuItem>
                      <MenuSeparator />
                      {loggedIn ? (
                        <>
                          <MenuItem icon={User} onClick={() => { close(); navigate('/profil') }}>{t('header.avatarMenu.profile')}</MenuItem>
                          <MenuItem icon={Settings} onClick={() => { close(); navigate('/einstellungen') }}>{t('header.avatarMenu.settings')}</MenuItem>
                          <MenuItem icon={LogOut} onClick={() => { close(); signOut() }}>{t('header.avatarMenu.logout')}</MenuItem>
                        </>
                      ) : (
                        <>
                          <MenuItem icon={LogIn} onClick={() => { close(); navigate('/anmelden') }}>{t('header.login')}</MenuItem>
                          <MenuItem icon={UserPlus} onClick={() => { close(); navigate('/registrieren') }}>{t('header.register')}</MenuItem>
                        </>
                      )}
                    </>
                  )}
                </Menu>
              </span>

              <span className="only-desktop row" style={{ gap: 'var(--sp-2)' }}>
                <ThemeToggle />
                {loggedIn ? (
                  <>
                    <span style={{ position: 'relative' }}>
                      <IconButton icon={Bell} label={t('header.notifications')} to="/benachrichtigungen" />
                      {unread > 0 && <span className="notif-dot" />}
                    </span>
                    <Menu
                      align="right"
                      trigger={({ toggle }) => (
                        <button type="button" className="btn btn-icon" onClick={toggle} aria-label={user.username}>
                          <Avatar name={user.username} size={32} />
                        </button>
                      )}
                    >
                      {({ close }) => (
                        <>
                          <MenuItem icon={User} onClick={() => { close(); navigate('/profil') }}>{t('header.avatarMenu.profile')}</MenuItem>
                          <MenuItem icon={Bookmark} onClick={() => { close(); navigate('/profil?tab=saved') }}>{t('header.avatarMenu.saved')}</MenuItem>
                          <MenuItem icon={Settings} onClick={() => { close(); navigate('/einstellungen') }}>{t('header.avatarMenu.settings')}</MenuItem>
                          <MenuSeparator />
                          {/*
                            * „Hilfe" führte ins Leere: Der Punkt schloss nur
                            * das Menü. Ein Hilfezentrum gibt es im MVP nicht,
                            * die Richtlinien gibt es. Dorthin also, statt
                            * einen Knopf stehen zu lassen, der nichts tut.
                            */}
                          <MenuItem icon={CircleHelp} onClick={() => { close(); navigate('/richtlinien') }}>
                            {t('header.avatarMenu.help')}
                          </MenuItem>
                          <MenuItem icon={LogOut} onClick={() => { close(); signOut() }}>{t('header.avatarMenu.logout')}</MenuItem>
                        </>
                      )}
                    </Menu>
                  </>
                ) : (
                  <>
                    <Link to="/fuer-gastronomen" className="btn btn-quiet">{t('header.forRestaurants')}</Link>
                    <Button variant="secondary" to="/anmelden">{t('header.login')}</Button>
                    <Button variant="primary" to="/registrieren">{t('header.register')}</Button>
                  </>
                )}
              </span>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
