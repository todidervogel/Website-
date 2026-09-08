import { Link } from 'react-router-dom'
import { Button } from '../../design/ui'
import { useDesignState } from '../../lib/design-state'
import { t } from '../../design/i18n'

/*
 * Das Aufbau-Banner stand hier bis Runde 9: ein Streifen ganz oben mit
 * „Tellerrand befindet sich im Aufbau". Es ist raus.
 *
 * Ein Band, das auf jeder Seite über allem klebt, kostet Platz auf jedem
 * Bildschirm und sagt nach dem zweiten Mal nichts Neues mehr. Was noch fehlt,
 * steht dort, wo es fehlt: leere Listen sagen selbst, dass sie leer sind.
 */

/** TEIL H, Cookie-Banner beim ersten Besuch. */
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
