import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { Button, IconButton } from '../../design/ui'
import { useDesignState } from '../../lib/design-state'
import { t } from '../../design/i18n'

/** TEIL B.5 — Aufbau-Banner (nur MVP 0), ganz oben über der Kopfleiste. */
export function BuildBanner() {
  const { buildBanner, setBuildBanner } = useDesignState()
  if (!buildBanner) return null
  return (
    <div className="build-banner">
      <span>
        <strong>{t('buildBanner.strong')}</strong> {t('buildBanner.text')}{' '}
        <Link to="/richtlinien" className="c-accent">{t('buildBanner.link')}</Link>
      </span>
      <IconButton
        icon={X}
        size={16}
        label={t('buildBanner.dismiss')}
        className="banner-close"
        onClick={() => setBuildBanner(false)}
      />
    </div>
  )
}

/** TEIL H — Cookie-Banner beim ersten Besuch. */
export function CookieBanner() {
  const { cookieBanner, setCookieBanner } = useDesignState()
  if (!cookieBanner) return null
  return (
    <div className="cookie-banner" role="dialog" aria-label={t('legal.banner.title')}>
      <h3 className="t-h3">{t('legal.banner.title')}</h3>
      <p className="t-body c-secondary" style={{ marginTop: 'var(--sp-1)' }}>
        {t('legal.banner.text')} <Link to="/cookies" className="c-accent">{t('legal.banner.more')}</Link>
      </p>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 'var(--sp-4)' }}>
        <Button variant="quiet" to="/cookies" onClick={() => setCookieBanner(false)}>{t('legal.banner.settings')}</Button>
        <Button variant="primary" onClick={() => setCookieBanner(false)}>{t('legal.banner.ok')}</Button>
      </div>
    </div>
  )
}
