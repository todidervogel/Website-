import { useState } from 'react'
import { Button, Switch } from '../../design/ui'
import { Page } from '../../components/layout'
import { t } from '../../design/i18n'

/**
 * TEIL H, Rechtstexte.
 * Einheitliches Layout: max. 720 px, Titel, Datum, Inhaltsverzeichnis, Fließtext.
 * Die Inhalte sind Platzhalter und müssen vor dem Start juristisch ersetzt werden.
 */
export function LegalPage({ titleKey, sections }) {
  const title = t(`legal.${titleKey}.title`)
  return (
    <Page title={title} bottomNav={false}>
      <article className="legal">
        <h1 className="t-h1">{title}</h1>
        <p className="t-small c-secondary" style={{ marginTop: 'var(--sp-2)' }}>
          {t('legal.updatedAt', { date: '1. September 2026' })}
        </p>

        <nav className="toc card card-flat" style={{ marginTop: 'var(--sp-6)' }}>
          <p className="t-small c-secondary" style={{ marginBottom: 'var(--sp-2)' }}>{t('legal.toc')}</p>
          {sections.map((s, i) => (
            <a key={s} href={`#abschnitt-${i + 1}`}>{i + 1}. {s}</a>
          ))}
        </nav>

        {sections.map((s, i) => (
          <section key={s} id={`abschnitt-${i + 1}`}>
            <h2>{i + 1}. {s}</h2>
            <p>{t('legal.placeholder')}</p>
            <p>{t('legal.placeholder')}</p>
          </section>
        ))}
      </article>
    </Page>
  )
}

export const Imprint = () => (
  <LegalPage titleKey="imprint" sections={['Angaben gemäß § 5 TMG', 'Vertretungsberechtigte', 'Kontakt', 'Umsatzsteuer-ID', 'Verantwortlich für den Inhalt', 'Streitschlichtung']} />
)

export const Privacy = () => (
  <LegalPage titleKey="privacy" sections={['Verantwortliche Stelle', 'Welche Daten wir verarbeiten', 'Standortdaten', 'Videos und Bewertungen', 'Cookies und Reichweitenmessung', 'Empfänger und Auftragsverarbeiter', 'Speicherdauer', 'Deine Rechte', 'Kontakt zum Datenschutz']} />
)

export const Terms = () => (
  <LegalPage titleKey="terms" sections={['Geltungsbereich', 'Registrierung und Konto', 'Inhalte der Nutzer', 'Bewertungen', 'Verbotene Inhalte', 'Rechte an hochgeladenen Inhalten', 'Sperrung und Kündigung', 'Haftung', 'Änderungen dieser Bedingungen']} />
)

export const GastroTerms = () => (
  <LegalPage titleKey="gastroTerms" sections={['Geltungsbereich', 'Zugang und Verifizierung', 'Profilangaben', 'Umgang mit Bewertungen', 'Antworten des Betriebs', 'Beanstandungsverfahren', 'Kosten', 'Laufzeit und Beendigung']} />
)

export const Guidelines = () => (
  <LegalPage titleKey="guidelines" sections={['Worum es uns geht', 'Ehrliche Bewertungen', 'Respektvoller Umgang', 'Persönlichkeitsrechte in Videos', 'Keine Werbung, kein Spam', 'Was wir entfernen', 'Was passiert bei Verstößen', 'Einspruch']} />
)

/** TEIL H, Cookie-Einstellungen mit Schaltern je Kategorie */
export function CookieSettings() {
  const [statistics, setStatistics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  return (
    <Page title={t('legal.cookies.title')} bottomNav={false}>
      <article className="legal">
        <h1 className="t-h1">{t('legal.cookies.title')}</h1>
        <p className="t-small c-secondary" style={{ marginTop: 'var(--sp-2)' }}>
          {t('legal.updatedAt', { date: '1. September 2026' })}
        </p>

        <div className="list-group" style={{ marginTop: 'var(--sp-6)' }}>
          <div className="list-row list-row-static" style={{ opacity: 0.6 }}>
            <span className="grow">
              <span className="t-body-bold">{t('legal.cookies.necessary')}</span>
              <span className="t-small c-secondary" style={{ display: 'block' }}>{t('legal.cookies.necessaryText')}</span>
            </span>
            <Switch checked disabled label={t('legal.cookies.necessary')} />
          </div>
          <div className="list-row list-row-static">
            <span className="grow">
              <span className="t-body-bold">{t('legal.cookies.statistics')}</span>
              <span className="t-small c-secondary" style={{ display: 'block' }}>{t('legal.cookies.statisticsText')}</span>
            </span>
            <Switch checked={statistics} onChange={setStatistics} label={t('legal.cookies.statistics')} />
          </div>
          <div className="list-row list-row-static">
            <span className="grow">
              <span className="t-body-bold">{t('legal.cookies.marketing')}</span>
              <span className="t-small c-secondary" style={{ display: 'block' }}>{t('legal.cookies.marketingText')}</span>
            </span>
            <Switch checked={marketing} onChange={setMarketing} label={t('legal.cookies.marketing')} />
          </div>
        </div>

        <div className="row-wrap" style={{ marginTop: 'var(--sp-6)' }}>
          <Button variant="secondary" onClick={() => { setStatistics(false); setMarketing(false) }}>
            {t('legal.cookies.rejectAll')}
          </Button>
          <Button variant="secondary">{t('common.saveSelection')}</Button>
          <Button variant="primary" onClick={() => { setStatistics(true); setMarketing(true) }}>
            {t('legal.cookies.acceptAll')}
          </Button>
        </div>
      </article>
    </Page>
  )
}
