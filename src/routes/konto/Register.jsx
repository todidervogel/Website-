import { Link, useNavigate } from 'react-router-dom'
import {
  AffixInput, Button, Checkbox, Field, Input, Notice, PasswordInput, Select, StrengthMeter,
} from '../../design/ui'
import { CenteredPage } from '../../components/layout'
import { useSession } from '../../lib/session'
import { rules, useForm } from '../../lib/form'
import { t, tNodes } from '../../design/i18n'

const days = Array.from({ length: 31 }, (_, i) => String(i + 1))
const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
const years = Array.from({ length: 90 }, (_, i) => String(2010 - i))

/** Grobe Stärkeeinschätzung — Länge plus Zeichenvielfalt. */
function strengthOf(password = '') {
  if (password.length < 8) return 1
  const variety = [/[a-zäöüß]/, /[A-ZÄÖÜ]/, /[0-9]/, /[^\w]/].filter((r) => r.test(password)).length
  if (password.length >= 12 && variety >= 3) return 3
  return variety >= 2 ? 2 : 1
}

/** D.1 — Registrierung */
export default function Register() {
  const { startRegistration } = useSession()
  const navigate = useNavigate()

  const form = useForm({
    initial: {
      email: '', phone: '', username: '', password: '',
      day: '', month: '', year: '', terms: false, location: false, news: false,
    },
    schema: {
      email: [rules.required(), rules.email()],
      phone: [rules.required(), rules.phone()],
      username: [rules.required(), rules.username()],
      password: [rules.required(), rules.password()],
      year: [rules.required(t('auth.register.birthdayHint'))],
      terms: [rules.required(t('auth.register.errors.terms'))],
      location: [rules.required(t('auth.register.errors.terms'))],
    },
    onSubmit: async (values) => {
      /* Altersgrenze 16 nach Art. 8 DSGVO — hier wirklich geprüft. */
      const birth = new Date(Number(values.year), months.indexOf(values.month), Number(values.day || 1))
      const age = (Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000)
      if (Number.isFinite(age) && age < 16) {
        return { ok: false, field: 'year', error: t('auth.register.errors.age') }
      }

      const result = await startRegistration({
        email: values.email.trim(),
        phone: values.phone.trim(),
        username: values.username.trim().toLowerCase(),
        password: values.password,
        name: values.username.trim(),
      })
      if (!result.ok) return { ok: false, error: result.error }
      navigate('/registrieren/code')
      return { ok: true }
    },
  })

  return (
    <CenteredPage title={t('auth.register.title')}>
      <h1 className="t-h1">{t('auth.register.title')}</h1>
      <p className="t-body c-secondary" style={{ marginTop: 'var(--sp-2)' }}>{t('auth.register.subtitle')}</p>

      <form className="stack-4" style={{ marginTop: 'var(--sp-6)' }} onSubmit={form.handleSubmit} noValidate>
        {form.formError && <Notice tone="danger">{form.formError}</Notice>}

        <Field label={t('auth.register.email')} required error={form.error('email')}>
          {(id) => <Input id={id} type="email" placeholder={t('auth.register.emailPlaceholder')} {...form.field('email')} />}
        </Field>

        <Field label={t('auth.register.phone')} required hint={t('auth.register.phoneHint')} error={form.error('phone')}>
          {(id) => (
            <AffixInput
              id={id}
              prefixSelect={['+49', '+43', '+41']}
              placeholder={t('auth.register.phonePlaceholder')}
              {...form.field('phone')}
            />
          )}
        </Field>

        <Field label={t('auth.register.username')} required hint={t('auth.register.usernameHint')} error={form.error('username')}>
          {(id) => <AffixInput id={id} prefix="@" placeholder={t('auth.register.usernamePlaceholder')} {...form.field('username')} />}
        </Field>

        <Field label={t('auth.register.password')} required hint={t('auth.register.passwordHint')} error={form.error('password')}>
          {(id) => (
            <>
              <PasswordInput id={id} autoComplete="new-password" {...form.field('password')} />
              <StrengthMeter level={strengthOf(form.values.password)} />
            </>
          )}
        </Field>

        <Field label={t('auth.register.birthday')} required hint={t('auth.register.birthdayHint')} error={form.error('year')}>
          <div className="row" style={{ gap: 'var(--sp-2)' }}>
            <Select
              placeholder={t('auth.register.day')} options={days} aria-label={t('auth.register.day')}
              value={form.values.day} onChange={(e) => form.setValue('day', e.target.value)}
            />
            <Select
              placeholder={t('auth.register.month')} options={months} aria-label={t('auth.register.month')}
              value={form.values.month} onChange={(e) => form.setValue('month', e.target.value)}
            />
            <Select
              placeholder={t('auth.register.year')} options={years} aria-label={t('auth.register.year')}
              value={form.values.year} onChange={(e) => form.setValue('year', e.target.value)}
            />
          </div>
        </Field>

        <div className="stack-2">
          <Checkbox
            checked={form.values.terms}
            onChange={(e) => form.setValue('terms', e.target.checked)}
            label={
              <>
                {tNodes('auth.register.acceptTerms', {
                  terms: <Link to="/agb" className="c-accent">{t('footer.terms')}</Link>,
                  privacy: <Link to="/datenschutz" className="c-accent">{t('footer.privacy')}</Link>,
                })}
                <span className="field-required">*</span>
              </>
            }
          />
          {form.errors.terms && <p className="field-error" style={{ marginLeft: 30 }}>{form.errors.terms}</p>}

          <Checkbox
            checked={form.values.location}
            onChange={(e) => form.setValue('location', e.target.checked)}
            label={<>{t('auth.register.acceptLocation')} <span className="field-required">*</span></>}
          />
          {form.errors.location && <p className="field-error" style={{ marginLeft: 30 }}>{form.errors.location}</p>}

          <Checkbox
            checked={form.values.news}
            onChange={(e) => form.setValue('news', e.target.checked)}
            label={`${t('auth.register.acceptNews')} (${t('common.optional')})`}
          />
        </div>

        <Button type="submit" variant="primary" full loading={form.submitting}>{t('auth.register.submit')}</Button>

        <p className="t-small c-secondary" style={{ textAlign: 'center' }}>
          {t('auth.register.haveAccount')} <Link to="/anmelden" className="c-accent">{t('auth.register.loginLink')}</Link>
        </p>
      </form>
    </CenteredPage>
  )
}
