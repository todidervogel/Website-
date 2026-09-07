import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Notice } from '../../design/ui'
import { Button, Field, Input, PasswordInput } from '../../design/ui'
import { CenteredPage } from '../../components/layout'
import { useSession } from '../../lib/session'
import { rules, useForm } from '../../lib/form'
import { t } from '../../design/i18n'

/** D.3 — Anmelden */
export default function Login() {
  const { login } = useSession()
  const navigate = useNavigate()
  const [hintOpen] = useState(true)

  const form = useForm({
    initial: { identifier: '', password: '' },
    schema: {
      identifier: [rules.required()],
      password: [rules.required()],
    },
    onSubmit: async (values) => {
      const result = await login(values.identifier, values.password)
      if (!result.ok) return { ok: false, error: result.error }

      /* Jede Rolle landet dort, wo sie hingehört. */
      if (result.mustChangePassword) navigate('/gastro/willkommen', { replace: true })
      else if (result.user.role === 'admin') navigate('/admin', { replace: true })
      else if (result.user.role === 'gastro') navigate('/gastro', { replace: true })
      else navigate('/feed', { replace: true })
      return { ok: true }
    },
  })

  return (
    <CenteredPage title={t('auth.login.title')}>
      <h1 className="t-h1">{t('auth.login.title')}</h1>

      <form className="stack-4" style={{ marginTop: 'var(--sp-6)' }} onSubmit={form.handleSubmit} noValidate>
        {form.formError && <Notice tone="danger">{form.formError}</Notice>}

        <Field label={t('auth.login.identifier')} required error={form.error('identifier')}>
          {(id) => <Input id={id} autoComplete="username" {...form.field('identifier')} />}
        </Field>

        <Field label={t('auth.login.password')} required error={form.error('password')}>
          {(id) => <PasswordInput id={id} autoComplete="current-password" {...form.field('password')} />}
        </Field>

        {/* Der Link steht unter dem Feld, nicht daneben — sonst klebt er am Label. */}
        <p className="login-forgot">
          <Link to="/passwort-vergessen" className="c-accent t-small">{t('auth.login.forgot')}</Link>
        </p>

        <Button type="submit" variant="primary" full loading={form.submitting}>
          {t('auth.login.submit')}
        </Button>

        <div className="row" style={{ gap: 'var(--sp-3)' }}>
          <hr className="divider grow" />
          <span className="t-small c-tertiary">{t('common.or')}</span>
          <hr className="divider grow" />
        </div>

        <Button variant="secondary" full to="/gastro/anmelden">{t('auth.login.gastro')}</Button>

        <p className="t-small c-secondary" style={{ textAlign: 'center' }}>
          {t('auth.login.noAccount')} <Link to="/registrieren" className="c-accent">{t('auth.login.registerLink')}</Link>
        </p>

        {hintOpen && <p className="t-tiny c-tertiary" style={{ textAlign: 'center' }}>{t('auth.demoHint')}</p>}
      </form>
    </CenteredPage>
  )
}
