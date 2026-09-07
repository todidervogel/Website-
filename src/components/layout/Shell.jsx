import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { BottomNav } from './BottomNav'
import { BuildBanner, CookieBanner } from './Banners'
import { useDesignState } from '../../lib/design-state'

/** Setzt den Seitentitel und scrollt bei Seitenwechsel nach oben. */
export function useScreen(title) {
  const { pathname } = useLocation()
  useEffect(() => {
    document.title = title ? `${title} — Design-Prototyp` : 'Design-Prototyp'
    window.scrollTo(0, 0)
  }, [title, pathname])
}

/**
 * Standardseite: Aufbau-Banner · Kopfleiste · Inhalt · Fußzeile · untere Navigation.
 */
export function Page({ title, children, footer = true, bottomNav = true, headerSuffix, minimalHeader, wide }) {
  useScreen(title)
  const { isWeb } = useDesignState()
  return (
    <div className="app-shell">
      <BuildBanner />
      <Header suffix={headerSuffix} minimal={minimalHeader} />
      <main className={`app-main ${bottomNav ? 'has-bottom-nav' : ''}`}>
        {wide ? children : <div className="container">{children}</div>}
      </main>
      {footer && isWeb && <Footer />}
      {bottomNav && <BottomNav />}
      <CookieBanner />
    </div>
  )
}

/**
 * Seite ohne eigenen Container — für Karte, Konsolen und andere
 * Screens, die die volle Breite selbst verwalten.
 */
export function BarePage({ title, children, bottomNav = true, headerSuffix, minimalHeader, chrome = true }) {
  useScreen(title)
  const { pureMap } = useDesignState()
  /* `chrome={false}` blendet Banner und Kopfleiste aus — die reine Kartenansicht. */
  const bare = chrome === false || pureMap

  return (
    <div className="app-shell">
      {!bare && <BuildBanner />}
      {!bare && <Header suffix={headerSuffix} minimal={minimalHeader} />}
      <main className={`app-main ${bottomNav && !bare ? 'has-bottom-nav' : ''}`}>{children}</main>
      {bottomNav && <BottomNav />}
      {!bare && <CookieBanner />}
    </div>
  )
}

/**
 * Vollbildseite ohne Kopf- und Fußleiste — Feed (C.6) und Aufnehmen (E.1).
 */
export function FullscreenPage({ title, children, bottomNav = true, dark = true }) {
  useScreen(title)
  return (
    <div className="fullheight" style={{ background: dark ? 'var(--bg-dark)' : 'var(--bg-light)' }}>
      {children}
      {bottomNav && <BottomNav dark={dark} />}
    </div>
  )
}

/**
 * Zentrierte Karte für Konto-Screens (TEIL D) — max. 420 px breit.
 */
export function CenteredPage({ title, children, width = 420, headerSuffix, minimalHeader }) {
  useScreen(title)
  return (
    <div className="app-shell">
      <BuildBanner />
      <Header suffix={headerSuffix} minimal={minimalHeader} />
      <main className="app-main has-bottom-nav" style={{ display: 'grid', placeItems: 'start center', paddingBlock: 'var(--sp-12)' }}>
        <div className="container" style={{ maxWidth: width + 48 }}>{children}</div>
      </main>
      <CookieBanner />
    </div>
  )
}
