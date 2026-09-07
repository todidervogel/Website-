import { Accordion, Button } from '../../design/ui'
import { Page } from '../../components/layout'
import { Coins, MapPin, Search } from 'lucide-react'
import { t } from '../../design/i18n'

const STEPS = ['s1', 's2', 's3', 's4']
const FAQ = [1, 2, 3, 4, 5].map((i) => ({ q: t(`gastro.landing.faq.q${i}`), a: t(`gastro.landing.faq.a${i}`) }))

/** F.13 — Landingpage für Gastronomen */
export default function GastroLanding() {
  return (
    <Page title={t('gastro.landing.title')}>
      <section className="section" style={{ maxWidth: 720 }}>
        <h1 className="t-display">{t('gastro.landing.title')}</h1>
        <p className="t-body c-secondary" style={{ marginTop: 'var(--sp-3)' }}>{t('gastro.landing.subtitle')}</p>
        <div className="row-wrap" style={{ marginTop: 'var(--sp-6)' }}>
          <Button variant="primary" to="/gastro/eintragen">{t('gastro.landing.cta')}</Button>
          <Button variant="secondary" to="/gastro/anmelden">{t('gastro.landing.login')}</Button>
        </div>
      </section>

      <section style={{ paddingBottom: 'var(--sp-12)' }}>
        <h2 className="t-h2" style={{ marginBottom: 'var(--sp-6)' }}>{t('gastro.landing.whyTitle')}</h2>
        <div style={{ display: 'grid', gap: 'var(--sp-6)', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {[[Search, 'found'], [MapPin, 'one'], [Coins, 'free']].map(([Icon, key]) => (
            <div key={key}>
              <Icon size={28} className="c-accent" />
              <h3 className="t-h3" style={{ marginTop: 'var(--sp-3)' }}>{t(`gastro.landing.why.${key}Title`)}</h3>
              <p className="t-body c-secondary" style={{ marginTop: 'var(--sp-1)' }}>{t(`gastro.landing.why.${key}Text`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ paddingBottom: 'var(--sp-12)' }}>
        <h2 className="t-h2" style={{ marginBottom: 'var(--sp-6)' }}>{t('gastro.landing.howTitle')}</h2>
        <ol style={{ display: 'grid', gap: 'var(--sp-4)', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', listStyle: 'none', padding: 0, margin: 0 }}>
          {STEPS.map((s, i) => (
            <li key={s} className="row" style={{ alignItems: 'flex-start' }}>
              <span
                className="avatar-placeholder"
                style={{ width: 32, height: 32, fontSize: 15 }}
              >
                {i + 1}
              </span>
              <span className="t-body-bold grow">{t(`gastro.landing.steps.${s}`)}</span>
            </li>
          ))}
        </ol>
      </section>

      <section style={{ paddingBottom: 'var(--sp-12)', maxWidth: 720 }}>
        <h2 className="t-h2" style={{ marginBottom: 'var(--sp-3)' }}>{t('gastro.landing.faqTitle')}</h2>
        <Accordion items={FAQ} />
      </section>

      <section
        style={{
          background: 'var(--accent-soft)', borderRadius: 'var(--r-card)',
          padding: 'var(--sp-8)', marginBottom: 'var(--sp-12)', textAlign: 'center',
        }}
      >
        <h2 className="t-h2">{t('gastro.landing.readyTitle')}</h2>
        <Button variant="primary" to="/gastro/eintragen" style={{ marginTop: 'var(--sp-4)' }}>
          {t('gastro.landing.cta')}
        </Button>
      </section>
    </Page>
  )
}
