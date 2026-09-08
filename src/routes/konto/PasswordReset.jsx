import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Button, EmptyState, Field, Input, Notice, PasswordInput, StrengthMeter } from '../../design/ui'
import { CenteredPage } from '../../components/layout'
import { useSession } from '../../lib/session'
import { rules, useForm } from '../../lib/form'
import { t } from '../../design/i18n'

/** Gleiche Stärkeregel wie bei der Registrierung. */
function strengthOf(password = '') {
  if (password.length < 8) return 1
  const variety = [/[a-zäöüß]/, /[A-ZÄÖÜ]/, /[0-9]/, /[^\w]/].filter((r) => r.test(password)).length
  if (password.length >= 12 && variety >= 3) return 3
  return variety >= 2 ? 2 : 1
}

/**
 * D.4, Passwort vergessen
 *
 * Der Link per E-Mail fehlt, weil es keinen Versand gibt. Statt zu tun, als
 * käme gleich eine Mail, sagt die Seite offen, was Sache ist: Im Testbetrieb
 * lässt sich das Passwort nur im angemeldeten Zustand ändern. Ein
 * Zurücksetzen ohne Nachweis wäre eine offene Tür.
 */
export function ForgotPassword() {
  const [sent, setSent] = useState(false)

  const form = useForm({
    initial: { email: '' },
    schema: { email: [rules.required(), rules.email()] },
    /* Ob es das Konto gibt, verrät die Seite bewusst nicht, sonst ließe sich
       damit prüfen, wer hier ein Konto hat. */
    onSubmit: () => { setSent(true); return { ok: true } },
  })

  return (
    <CenteredPage title={t('auth.forgot.title')}>
      {sent ? (
        <EmptyState
          icon={CheckCircle2}
          title={t('auth.forgot.sentTitle')}
          text={t('auth.forgot.sentText')}
          action={<Button variant="primary" to="/anmelden">{t('auth.forgot.backToLogin')}</Button>}
        />
      ) : (
        <>
          <h1 className="t-h1">{t('auth.forgot.title')}</h1>
          <p className="t-body c-secondary" style={{ marginTop: 'var(--sp-2)' }}>{t('auth.forgot.text')}</p>
          <form className="stack-4" style={{ marginTop: 'var(--sp-6)' }} onSubmit={form.handleSubmit} noValidate>
            <Field label={t('auth.register.email')} required error={form.error('email')}>
              {(id) => <Input id={id} type="email" placeholder={t('auth.register.emailPlaceholder')} {...form.field('email')} />}
            </Field>
            <Button type="submit" variant="primary" full loading={form.submitting}>{t('auth.forgot.submit')}</Button>
            <Notice>{t('auth.forgotTestHint')}</Notice>
          </form>
        </>
      )}
    </CenteredPage>
  )
}

/** D.5, Neues Passwort. Nur für angemeldete Konten. */
export function NewPassword() {
  const { loggedIn, changePassword } = useSession()
  const navigate = useNavigate()
  const [done, setDone] = useState(false)

  const form = useForm({
    initial: { password: '', repeat: '' },
    schema: {
      password: [rules.required(), rules.password()],
      repeat: [rules.required(), rules.matches('password')],
    },
    onSubmit: async (values) => {
      await changePassword(values.password)
      setDone(true)
      setTimeout(() => navigate('/einstellungen', { replace: true }), 900)
      return { ok: true }
    },
  })

  if (!loggedIn) {
    return (
      <CenteredPage title={t('auth.newPassword.title')}>
        <EmptyState
          title={t('auth.newPassword.title')}
          text={t('auth.newPasswordNeedsLogin')}
          action={<Button variant="primary" to="/anmelden">{t('auth.gate.login')}</Button>}
        />
      </CenteredPage>
    )
  }

  return (
    <CenteredPage title={t('auth.newPassword.title')}>
      <h1 className="t-h1">{t('auth.newPassword.title')}</h1>

      <form className="stack-4" style={{ marginTop: 'var(--sp-6)' }} onSubmit={form.handleSubmit} noValidate>
        {form.formError && <Notice tone="danger">{form.formError}</Notice>}
        {done && <Notice tone="success">{t('common.saved')}</Notice>}

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
        <Button type="submit" variant="primary" full loading={form.submitting}>{t('auth.newPassword.submit')}</Button>
      </form>
    </CenteredPage>
  )
}
