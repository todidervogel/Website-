import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Switch } from '../../design/ui'
import { GastroShell, useMyPlace } from './GastroShell'
import { ConsoleHeader } from '../../components/layout'
import { CloseBusinessDialog, VerificationDialog } from '../dialogs/GastroDialogs'
import { ChevronRight } from 'lucide-react'
import { api } from '../../lib/store'
import { t } from '../../design/i18n'

function Row({ label, hint, to, onClick, control, badge, disabled }) {
  const inner = (
    <>
      <span className="grow">
        <span className="t-body">{label} {badge}</span>
        {hint && <span className="t-small c-secondary" style={{ display: 'block' }}>{hint}</span>}
      </span>
      {control ?? <ChevronRight size={18} className="c-tertiary" />}
    </>
  )
  if (control) return <div className="list-row list-row-static">{inner}</div>
  if (disabled) return <div className="list-row list-row-static" style={{ opacity: 0.4 }}>{inner}</div>
  if (to) return <Link to={to} className="list-row">{inner}</Link>
  return <button type="button" className="list-row" onClick={onClick}>{inner}</button>
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="t-small c-secondary" style={{ marginBottom: 'var(--sp-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {title}
      </h2>
      <div className="list-group">{children}</div>
    </section>
  )
}

/** F.11, Gastro-Einstellungen */
export default function GastroSettings() {
  return (
    <GastroShell title={t('gastro.settings.title')}>
      <SettingsBody />
    </GastroShell>
  )
}

function SettingsBody() {
  const place = useMyPlace()
  const [flags, setFlags] = useState({ nReview: true, nVideo: true, nModeration: true, nNews: false })
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)
  const set = (k) => (v) => setFlags((f) => ({ ...f, [k]: v }))

  return (
    <>
      <ConsoleHeader title={t('gastro.settings.title')} />

      <div className="stack-8" style={{ maxWidth: 640 }}>
        <Section title={t('gastro.settings.sections.access')}>
          <Row label={t('gastro.settings.changeEmail')} to="/gastro/einstellungen" />
          <Row label={t('gastro.settings.changePassword')} to="/passwort-neu" />
          <Row label={t('gastro.settings.inviteStaff')} disabled badge={<Badge tone="accent">{t('common.soonBadge')}</Badge>} />
        </Section>

        <Section title={t('gastro.settings.sections.verification')}>
          <Row
            label={place.verified ? t('common.verified') : t('gastro.settings.notVerified')}
            badge={place.verified ? <Badge tone="verified">{t('common.verified')}</Badge> : null}
            control={place.verified
              ? <span className="t-small c-success">✓</span>
              : <Button variant="primary" size="sm" onClick={() => setVerifyOpen(true)}>{t('gastro.settings.startVerification')}</Button>}
          />
        </Section>

        <Section title={t('gastro.settings.sections.notifications')}>
          {[['nReview', 'notifyReview'], ['nVideo', 'notifyVideo'], ['nModeration', 'notifyModeration'], ['nNews', 'notifyNews']].map(
            ([key, labelKey]) => (
              <Row
                key={key}
                label={t(`gastro.settings.${labelKey}`)}
                control={<Switch checked={flags[key]} onChange={set(key)} label={t(`gastro.settings.${labelKey}`)} />}
              />
            ),
          )}
        </Section>

        <Section title={t('gastro.settings.sections.business')}>
          <Row label={t('gastro.settings.closeBusiness')} onClick={() => setCloseOpen(true)} />
          <Row
            label={t('gastro.settings.hideProfile')}
            hint={t('gastro.settings.hideProfileHint')}
            control={
              <Switch
                checked={place.status === 'archived'}
                onChange={(v) => api.places.setStatus(place.id, v ? 'archived' : 'active')}
                label={t('gastro.settings.hideProfile')}
              />
            }
          />
        </Section>

        <Section title={t('gastro.settings.sections.legal')}>
          <Row label={t('gastro.settings.gastroTerms')} to="/agb-gastro" />
          <Row label={t('gastro.settings.dpa')} to="/agb-gastro" />
          <Row label={t('gastro.settings.privacy')} to="/datenschutz" />
        </Section>
      </div>

      <VerificationDialog open={verifyOpen} onClose={() => setVerifyOpen(false)} />
      <CloseBusinessDialog open={closeOpen} onClose={() => setCloseOpen(false)} place={place} />
    </>
  )
}
