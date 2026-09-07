import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Lock, Search, WifiOff } from 'lucide-react'
import { Button, EmptyState } from '../../design/ui'
import { Page } from '../../components/layout'
import { t } from '../../design/i18n'

/** TEIL I — Fehlerseiten */
function ErrorScreen({ icon, titleKey, children }) {
  return (
    <Page title={t(`errors.${titleKey}.title`)} bottomNav={false}>
      <div style={{ paddingBlock: 'var(--sp-16)' }}>
        <EmptyState
          icon={icon}
          title={t(`errors.${titleKey}.title`)}
          text={t(`errors.${titleKey}.text`)}
          action={children}
        />
      </div>
    </Page>
  )
}

export const NotFound = () => (
  <Page title={t('errors.e404.title')} bottomNav={false}>
    <div style={{ paddingBlock: 'var(--sp-16)' }}>
      <EmptyState
        icon={Search}
        title={t('errors.e404.title')}
        text={t('errors.e404.text')}
        action={<Button variant="primary" to="/">{t('errors.e404.cta')}</Button>}
        secondaryAction={<Button variant="quiet" to="/karte">{t('errors.e404.secondary')}</Button>}
      />
    </div>
  </Page>
)

export const ServerError = () => (
  <ErrorScreen icon={AlertTriangle} titleKey="e500">
    <Button variant="primary" onClick={() => window.location.reload()}>{t('errors.e500.cta')}</Button>
  </ErrorScreen>
)

export const Offline = () => (
  <ErrorScreen icon={WifiOff} titleKey="offline">
    <Button variant="primary" onClick={() => window.location.reload()}>{t('errors.offline.cta')}</Button>
  </ErrorScreen>
)

export function Forbidden() {
  const navigate = useNavigate()
  return (
    <ErrorScreen icon={Lock} titleKey="e403">
      <Button variant="quiet" onClick={() => navigate(-1)}>{t('errors.e403.cta')}</Button>
    </ErrorScreen>
  )
}
