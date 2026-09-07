import { Link } from 'react-router-dom'
import { Badge } from '../design/ui'
import { Page } from '../components/layout'
import { allRoutes, routeGroups } from './index'
import { t } from '../design/i18n'

/**
 * Kein Screen der Spezifikation, sondern eine Übersicht für die Abnahme:
 * listet alle Routen aus TEIL J mit ihrem Abschnitt in der Spezifikation.
 */
export default function ScreenIndex() {
  return (
    <Page title={t('index.title')}>
      <div style={{ paddingBlock: 'var(--sp-8) var(--sp-16)' }} className="stack-8">
        <div>
          <h1 className="t-h1">{t('index.title')}</h1>
          <p className="t-body c-secondary" style={{ marginTop: 'var(--sp-2)', maxWidth: 640 }}>
            {t('index.subtitle', { count: allRoutes.length })}
          </p>
        </div>

        {routeGroups.map((group) => (
          <section key={group.id}>
            <h2 className="t-h2" style={{ marginBottom: 'var(--sp-3)' }}>{t(`index.groups.${group.id}`)}</h2>
            <div className="list-group">
              {group.routes.map((r) => (
                <Link className="list-row" to={r.path} key={r.path}>
                  <Badge tone="accent">{r.spec}</Badge>
                  <span className="grow t-body">{r.label}</span>
                  <code className="t-small c-secondary">{r.pattern ?? r.path}</code>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Page>
  )
}
