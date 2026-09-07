import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import { Switch, useToast } from '../../design/ui'
import { useDesignState } from '../../lib/design-state'
import { useSession } from '../../lib/session'
import { MODE, resetLocalData, SERVER } from '../../lib/store'
import { t } from '../../design/i18n'

/** Kleine Auswahlleiste mit zwei oder mehr Schaltern. */
function Segmented({ label, options, value, onChange, hint }) {
  return (
    <div>
      <p className="t-small c-secondary" style={{ marginBottom: 4 }}>{label}</p>
      <div className="seg">
        {options.map(({ id, label: text, disabled }) => (
          <button
            key={id}
            type="button"
            aria-pressed={value === id}
            disabled={disabled}
            style={disabled ? { opacity: 0.4, cursor: 'default' } : undefined}
            onClick={() => !disabled && onChange(id)}
          >
            {text}
          </button>
        ))}
      </div>
      {hint && <p className="t-small c-tertiary" style={{ marginTop: 4 }}>{hint}</p>}
    </div>
  )
}

/**
 * Design-Panel — Werkzeug für die Abnahme, kein Bestandteil des Produkts.
 *
 * Schaltet Ziel, Rolle, Darstellung, die drei Screen-Varianten (K.4), die
 * beiden Banner und die reine Kartenansicht um und setzt die Daten zurück.
 * Fällt in Schritt 2 komplett weg.
 */
export function DevPanel() {
  const [open, setOpen] = useState(false)
  const s = useDesignState()
  const session = useSession()
  const toast = useToast()

  /* In welcher Rolle sind wir gerade? */
  const role = session.loggedIn ? session.role : 'guest'

  /* Im Serverbetrieb gibt es keinen Schnellwechsel — dort zählt die Anmeldung. */
  const switchRole = (next) => {
    if (next === 'guest') return session.logout()
    return session.switchTo({ user: 'u1', gastro: 'g1', admin: 'a1' }[next] ?? null)
  }

  if (!open) {
    return (
      <button type="button" className="dev-toggle" onClick={() => setOpen(true)} aria-label={t('dev.open')} title={t('dev.title')}>
        <SlidersHorizontal size={18} />
      </button>
    )
  }

  return (
    <>
      <button type="button" className="dev-toggle" onClick={() => setOpen(false)} aria-label={t('common.close')}>
        <X size={18} />
      </button>
      <div className="dev-panel stack-3">
        <div className="row-between">
          <strong>{t('dev.title')}</strong>
          <span className="t-tiny c-tertiary">{t('dev.note')}</span>
        </div>

        <Segmented
          label={t('dev.platform')}
          value={s.platform}
          onChange={s.setPlatform}
          options={[
            { id: 'web', label: t('dev.platforms.web') },
            { id: 'app', label: t('dev.platforms.app') },
          ]}
        />

        <p className="t-small c-secondary">
          {t('dev.device')}:{' '}
          <strong className="c-primary">{t(`dev.devices.${s.device}`)}</strong>
          {s.os !== 'desktop' && s.os !== 'unknown' && ` · ${s.os}`}
          <br />
          <span className="t-tiny c-tertiary">{t('dev.deviceHint')}</span>
        </p>

        <Segmented
          label={t('dev.role')}
          value={role}
          onChange={switchRole}
          hint={SERVER ? t('dev.rolesNeedLogin') : (s.isApp && role === 'guest' ? t('dev.guestInApp') : t('dev.passwords'))}
          options={['guest', 'user', 'gastro', 'admin'].map((id) => ({
            id, label: t(`dev.roles.${id}`), disabled: SERVER && id !== 'guest',
          }))}
        />

        <p className="t-small c-secondary">
          {t('dev.mode')}: <strong className="c-primary">{MODE === 'server' ? t('dev.modes.server') : t('dev.modes.local')}</strong>
          {SERVER && <><br /><span className="t-tiny c-tertiary">{SERVER}</span></>}
        </p>

        <Segmented
          label={t('theme.label')}
          value={s.theme}
          onChange={s.setTheme}
          options={[
            { id: 'auto', label: t('dev.themes.auto') },
            { id: 'light', label: t('theme.light') },
            { id: 'dark', label: t('theme.dark') },
          ]}
        />

        <Segmented
          label={t('dev.state')}
          value={s.state}
          onChange={s.setState}
          options={['filled', 'empty', 'loading'].map((id) => ({ id, label: t(`dev.states.${id}`) }))}
        />

        <div className="row-between">
          <span className="t-small">{t('dev.pureMap')}</span>
          <Switch checked={s.pureMap} onChange={s.setPureMap} label={t('dev.pureMap')} />
        </div>
        <div className="row-between">
          <span className="t-small">{t('dev.buildBanner')}</span>
          <Switch checked={s.buildBanner} onChange={s.setBuildBanner} label={t('dev.buildBanner')} />
        </div>
        <div className="row-between">
          <span className="t-small">{t('dev.cookieBanner')}</span>
          <Switch checked={s.cookieBanner} onChange={s.setCookieBanner} label={t('dev.cookieBanner')} />
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-full btn-sm"
          disabled={!!SERVER}
          onClick={() => { resetLocalData(); toast(t('dev.resetDone')) }}
        >
          <RotateCcw size={16} /> {t('dev.reset')}
        </button>

        <Link to="/uebersicht" className="btn btn-secondary btn-full btn-sm" onClick={() => setOpen(false)}>
          {t('dev.screenIndex')}
        </Link>
      </div>
    </>
  )
}
