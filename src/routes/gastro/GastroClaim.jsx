import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Search } from 'lucide-react'
import {
  Button, Checkbox, EmptyState, Field, Input, Select, Skeleton,
} from '../../design/ui'
import { Page } from '../../components/layout'
import { api, useQuery } from '../../lib/store'
import { rules, useForm } from '../../lib/form'
import { t, tNodes } from '../../design/i18n'

const ROLES = ['owner', 'management', 'marketing', 'staff']
const TYPES = ['restaurant', 'cafe', 'bar', 'imbiss', 'baeckerei', 'eisdiele', 'pub', 'sonstiges']

/** F.14, Betrieb eintragen */
export default function GastroClaim() {
  const [mode, setMode] = useState(null) // null | 'claim' | 'new'
  const [target, setTarget] = useState(null)
  const [done, setDone] = useState(false)
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')

  const { data, loading } = 
    useQuery(() => api.places.list({ query: `${query} ${city}`.trim() }), [query, city], { initial: [] })
  const list = (query || city) ? (data ?? []).slice(0, 6) : (data ?? []).slice(0, 3)

  /**
   * Die Anfrage geht an die Redaktion: Ein bestehender Betrieb bekommt
   * claim_status='pending', ein neuer landet als Vorschlag in G.8.
   */
  const form = useForm({
    initial: { name: '', role: '', email: '', phone: '', businessName: '', street: '', zip: '', cityName: '', type: '', authorized: false, terms: false },
    schema: {
      name: [rules.required()],
      email: [rules.required(), rules.email()],
      phone: [rules.required(), rules.phone()],
      authorized: [rules.required(t('auth.register.errors.terms'))],
      terms: [rules.required(t('auth.register.errors.terms'))],
    },
    onSubmit: async (values) => {
      await api.admin.requestClaim(mode === 'claim' ? target?.id ?? null : null, values.email.trim())
      setDone(true)
      return { ok: true }
    },
  })

  if (done) {
    return (
      <Page title={t('gastro.claim.doneTitle')} footer={false}>
        <div style={{ paddingBlock: 'var(--sp-16)' }}>
          <EmptyState
            icon={CheckCircle2}
            title={t('gastro.claim.doneTitle')}
            text={t('gastro.claim.doneText')}
            action={<Button variant="primary" to="/">{t('errors.e404.cta')}</Button>}
          />
        </div>
      </Page>
    )
  }

  return (
    <Page title={t('gastro.claim.title')} headerSuffix={t('gastro.brandSuffix')}>
      <div style={{ paddingBlock: 'var(--sp-8) var(--sp-16)', maxWidth: 560 }} className="stack-6">
        <div>
          <h1 className="t-h1">{t('gastro.claim.title')}</h1>
          <p className="t-body c-secondary" style={{ marginTop: 'var(--sp-2)' }}>{t('gastro.claim.text')}</p>
        </div>

        {mode === null && (
          <>
            <div className="header-search" style={{ maxWidth: 'none' }}>
              <Search size={18} className="search-icon" />
              <input
                className="input" style={{ height: 44 }}
                placeholder={t('gastro.claim.searchPlaceholder')}
                aria-label={t('common.search')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <Field label={t('gastro.claim.cityLabel')}>
              {(id) => <Input id={id} placeholder={t('gastro.claim.cityPlaceholder')} value={city} onChange={(e) => setCity(e.target.value)} />}
            </Field>

            {loading ? (
              <div className="stack-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} h={64} radius="var(--r-card)" />)}</div>
            ) : (
              <div className="list-group">
                {list.map((p) => (
                  <div className="list-row list-row-static" key={p.id}>
                    <span className="grow">
                      <span className="t-body-bold" style={{ display: 'block' }}>{p.name}</span>
                      <span className="t-small c-secondary">{p.address}, {p.zip} {p.city}</span>
                    </span>
                    <Button
                      variant="secondary" size="sm"
                      disabled={p.claimStatus === 'verified'}
                      onClick={() => { setTarget(p); setMode('claim') }}
                    >
                      {p.claimStatus === 'verified' ? t('common.verified') : t('gastro.claim.isMine')}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button variant="quiet" onClick={() => setMode('new')} style={{ marginLeft: -8 }}>
              {t('gastro.claim.notFound')}
            </Button>
          </>
        )}

        {mode !== null && (
          <>
            <h2 className="t-h2">{mode === 'claim' ? t('gastro.claim.formClaimTitle') : t('gastro.claim.formNewTitle')}</h2>
            {target && <p className="t-body c-secondary">{target.name} · {target.address}</p>}

            <form className="stack-4" onSubmit={form.handleSubmit} noValidate>
              <Field label={t('gastro.claim.yourName')} required error={form.error('name')}>
                {(id) => <Input id={id} {...form.field('name')} />}
              </Field>
              <Field label={t('gastro.claim.yourRole')} required>
                {(id) => (
                  <Select
                    id={id} placeholder="–"
                    options={ROLES.map((r) => ({ value: r, label: t(`gastro.claim.roles.${r}`) }))}
                    value={form.values.role}
                    onChange={(e) => form.setValue('role', e.target.value)}
                  />
                )}
              </Field>
              <Field label={t('gastro.claim.email')} required hint={t('gastro.claim.emailHint')} error={form.error('email')}>
                {(id) => <Input id={id} type="email" placeholder={t('auth.register.emailPlaceholder')} {...form.field('email')} />}
              </Field>
              <Field label={t('gastro.claim.phone')} required error={form.error('phone')}>
                {(id) => <Input id={id} type="tel" {...form.field('phone')} />}
              </Field>

              {mode === 'new' && (
                <>
                  <Field label={t('gastro.claim.businessName')} required>
                    {(id) => <Input id={id} placeholder={t('upload.missing.namePlaceholder')} {...form.field('businessName')} />}
                  </Field>
                  <Field label={t('gastro.claim.street')} required>
                    {(id) => <Input id={id} {...form.field('street')} />}
                  </Field>
                  <div className="row" style={{ gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
                    <Field label={t('gastro.claim.zip')} required className="grow">
                      {(id) => <Input id={id} {...form.field('zip')} />}
                    </Field>
                    <Field label={t('gastro.claim.city')} required className="grow">
                      {(id) => <Input id={id} {...form.field('cityName')} />}
                    </Field>
                  </div>
                  <Field label={t('gastro.claim.type')} required>
                    {(id) => (
                      <Select
                        id={id} placeholder="–"
                        options={TYPES.map((v) => ({ value: v, label: t(`categories.${v}`) }))}
                        value={form.values.type}
                        onChange={(e) => form.setValue('type', e.target.value)}
                      />
                    )}
                  </Field>
                </>
              )}

              <div>
                <Checkbox
                  label={<>{t('gastro.claim.authorized')} <span className="field-required">*</span></>}
                  checked={form.values.authorized}
                  onChange={(e) => form.setValue('authorized', e.target.checked)}
                />
                {form.errors.authorized && <p className="field-error" style={{ marginLeft: 30 }}>{form.errors.authorized}</p>}
              </div>
              <div>
                <Checkbox
                  checked={form.values.terms}
                  onChange={(e) => form.setValue('terms', e.target.checked)}
                  label={
                    <>
                      {tNodes('gastro.claim.acceptTerms', {
                        terms: <Link to="/agb-gastro" className="c-accent">{t('gastro.welcome.termsLink')}</Link>,
                      })}
                      <span className="field-required">*</span>
                    </>
                  }
                />
                {form.errors.terms && <p className="field-error" style={{ marginLeft: 30 }}>{form.errors.terms}</p>}
              </div>

              <div className="row">
                <Button variant="secondary" onClick={() => setMode(null)}>{t('common.back')}</Button>
                <Button type="submit" variant="primary" loading={form.submitting}>{t('gastro.claim.submit')}</Button>
              </div>
            </form>
          </>
        )}
      </div>
    </Page>
  )
}
