import { Link, useNavigate } from 'react-router-dom'
import { Button, Checkbox, Field, Input, Notice, PasswordInput, StrengthMeter } from '../../design/ui'
import { CenteredPage } from '../../components/layout'
import { useSession } from '../../lib/session'
import { rules, useForm } from '../../lib/form'
import { t, tNodes } from '../../design/i18n'

/** F.1 — Gastro-Anmeldung */
export function GastroLogin() {
  const { login } = useSession()
  const navigate = useNavigate()

  const form = useForm({
    initial: { email: '', password: '' },
    schema: { email: [rules.required(), rules.email()], password: [rules.required()] },
    onSubmit: async (values) => {
      const result = await login(values.email, values.password)
      if (!result.ok) return { ok: false, error: result.error }
      if (result.user.role !== 'gastro' && result.user.role !== 'admin') {
        return { ok: false, error: t('auth.errors.unknownAccount') }
      }
      /* Beim ersten Mal muss zuerst ein eigenes Passwort her (F.2). */
      navigate(result.mustChangePassword ? '/gastro/willkommen' : '/gastro', { replace: true })
      return { ok: true }
    },
  })

  return (
    <CenteredPage title={t('gastro.login.title')} headerSuffix={t('gastro.brandSuffix')} minimalHeader>
      <h1 className="t-h1">{t('gastro.login.title')}</h1>
      <p className="t-body c-secondary" style={{ marginTop: 'var(--sp-2)' }}>{t('gastro.login.text')}</p>

      <form className="stack-4" style={{ marginTop: 'var(--sp-6)' }} onSubmit={form.handleSubmit} noValidate>
        {form.formError && <Notice tone="danger">{form.formError}</Notice>}

        <Field label={t('gastro.profile.email')} required error={form.error('email')}>
          {(id) => <Input id={id} type="email" placeholder={t('auth.register.emailPlaceholder')} {...form.field('email')} />}
        </Field>
        <Field label={t('auth.login.password')} required error={form.error('password')}>
          {(id) => <PasswordInput id={id} autoComplete="current-password" {...form.field('password')} />}
        </Field>

        <p className="login-forgot">
          <Link to="/passwort-vergessen" className="c-accent t-small">{t('auth.login.forgot')}</Link>
        </p>

        <Button type="submit" variant="primary" full loading={form.submitting}>
          {t('auth.login.submit')}
        </Button>

        <hr className="divider" />

        <p className="t-small c-secondary" style={{ textAlign: 'center' }}>
          {t('gastro.login.noAccess')}{' '}
          <Link to="/gastro/eintragen" className="c-accent">{t('gastro.login.claimLink')}</Link>
        </p>

        <p className="t-tiny c-tertiary" style={{ textAlign: 'center' }}>{t('auth.demoHint')}</p>
      </form>
    </CenteredPage>
  )
}

/** Stärkeeinschätzung — gleiche Regel wie bei der Registrierung. */
function strengthOf(password = '') {
  if (password.length < 8) return 1
  const variety = [/[a-zäöüß]/, /[A-ZÄÖÜ]/, /[0-9]/, /[^\w]/].filter((r) => r.test(password)).length
  if (password.length >= 12 && variety >= 3) return 3
  return variety >= 2 ? 2 : 1
}

/** F.2 — Erstes Passwort setzen */
export function GastroWelcome() {
  const { changePassword, mustChangePassword } = useSession()
  const navigate = useNavigate()

  const form = useForm({
    initial: { password: '', repeat: '', terms: false },
    schema: {
      password: [rules.required(), rules.password()],
      repeat: [rules.required(), rules.matches('password')],
      terms: [rules.required(t('auth.register.errors.terms'))],
    },
    onSubmit: async (values) => {
      await changePassword(values.password)
      navigate('/gastro/einrichtung', { replace: true })
      return { ok: true }
    },
  })

  return (
    <CenteredPage title={t('gastro.welcome.title')} headerSuffix={t('gastro.brandSuffix')} minimalHeader>
      <h1 className="t-h1">{t('gastro.welcome.title')}</h1>
      <p className="t-body c-secondary" style={{ marginTop: 'var(--sp-2)' }}>{t('gastro.welcome.text')}</p>

      <form className="stack-4" style={{ marginTop: 'var(--sp-6)' }} onSubmit={form.handleSubmit} noValidate>
        <Field label={t('auth.newPassword.password')} required error={form.error('password')}>
          {(id) => (
            <>
              <PasswordInput id={id} autoComplete="new-password" {...form.field('password')} />
              <StrengthMeter level={strengthOf(form.values.password)} />
            </>
          )}
        </Field>
        <Field label={t('auth.newPassword.repeat')} required error={form.error('repeat')}>
          {(id) => <PasswordInput id={id} autoComplete="new-password" {...form.field('repeat')} />}
        </Field>

        <div>
          <Checkbox
            checked={form.values.terms}
            onChange={(e) => form.setValue('terms', e.target.checked)}
            label={
              <>
                {tNodes('gastro.welcome.accept', {
                  terms: <Link to="/agb-gastro" className="c-accent">{t('gastro.welcome.termsLink')}</Link>,
                })}
                <span className="field-required">*</span>
              </>
            }
          />
          {form.errors.terms && <p className="field-error" style={{ marginLeft: 30 }}>{form.errors.terms}</p>}
        </div>

        <Button type="submit" variant="primary" full loading={form.submitting}>{t('common.next')}</Button>

        {!mustChangePassword && (
          <Button variant="quiet" full to="/gastro">{t('common.skip')}</Button>
        )}
      </form>
    </CenteredPage>
  )
}
