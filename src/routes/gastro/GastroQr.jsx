import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Button, Card, Field, Input, charCount, useToast } from '../../design/ui'
import { GastroShell, useMyPlace } from './GastroShell'
import { ConsoleHeader } from '../../components/layout'
import { useDesignState } from '../../lib/design-state'
import { oeffentlicheAdresse } from '../../lib/teilen'
import { t } from '../../design/i18n'

const TEMPLATES = ['a6', 'a4', 'sticker', 'plain']

/**
 * F.10, QR-Codes für den Aushang.
 *
 * ┌─ Wer benutzt diese Datei ────────────────────────────────────────────────┐
 * │  src/routes/gastro/GastroShell.jsx   Rahmen und der eigene Betrieb       │
 * │  src/lib/teilen.js                   die öffentliche Adresse            │
 * │  design/src/styles/print.css         wie der Aushang gedruckt aussieht  │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * ── Was hier vorher stand ─────────────────────────────────────────────────
 *
 * Ein Symbol aus der Icon-Sammlung, das aussah wie ein QR-Code. Daneben zwei
 * Knöpfe, „Als PDF herunterladen" und „PNG herunterladen", die eine Meldung
 * zeigten und nichts taten, und eine Sprachauswahl ohne Wirkung.
 *
 * Das war die gefährlichste Stelle der ganzen App: Ein Betrieb hätte das
 * ausgedruckt und aufgehängt, und Gäste hätten auf ein Bild gescannt, das
 * keine Adresse enthält. Jetzt ist es ein echter Code, erzeugt aus der
 * Adresse, die darunter steht, und man kann ihn drucken oder speichern.
 *
 * ── Warum eine Bibliothek ─────────────────────────────────────────────────
 *
 * Ein QR-Code ist kein Muster, das man freihändig malt: Maskierung,
 * Reed-Solomon-Korrektur und Formatbits müssen stimmen, sonst scannt er
 * nicht, und man sieht ihm das nicht an. `qrcode` ist klein, ohne eigene
 * Abhängigkeiten und macht genau diese eine Sache.
 */
export default function GastroQr() {
  return (
    <GastroShell title={t('gastro.qr.title')}>
      <QrBody />
    </GastroShell>
  )
}

function QrBody() {
  const place = useMyPlace()
  const { isApp } = useDesignState()
  const [template, setTemplate] = useState('a6')
  const [target, setTarget] = useState('place')
  const [text, setText] = useState(t('gastro.qr.textPlaceholder'))
  const [bild, setBild] = useState(null)
  const toast = useToast()

  /* Der Code führt entweder auf die Betriebsseite oder auf die Speisekarte. */
  const pfad = target === 'menu' ? `/g/${place.slug}/speisekarte?src=qr` : `/g/${place.slug}?src=qr`
  const url = oeffentlicheAdresse(pfad)

  /*
   * Der Code wird bei jeder Änderung neu gezeichnet. Fehlerkorrektur „M"
   * verträgt etwa 15 Prozent Verlust: genug für einen Aushang, der mit der
   * Zeit Flecken bekommt, ohne den Code unnötig groß zu machen.
   */
  useEffect(() => {
    let abgebrochen = false
    QRCode.toDataURL(url, { width: 720, margin: 1, errorCorrectionLevel: 'M' })
      .then((datenAdresse) => { if (!abgebrochen) setBild(datenAdresse) })
      .catch(() => { if (!abgebrochen) setBild(null) })
    return () => { abgebrochen = true }
  }, [url])

  const kopieren = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast(t('toast.linkCopied'))
    } catch {
      toast(t('toast.error'), 'error')
    }
  }

  /**
   * Speichern.
   *
   * Auf der Webseite lädt der Browser die Datei herunter. In der App gibt es
   * keinen Download-Ordner, den man danach findet, deshalb geht das Bild dort
   * in die Teilen-Auswahl des Geräts: von da aus in die Galerie, in eine
   * Nachricht oder in die Druck-App.
   */
  const speichern = async () => {
    if (!bild) return
    const antwort = await fetch(bild)
    const blob = await antwort.blob()
    const datei = new File([blob], `qr-${place.slug}.png`, { type: 'image/png' })

    if (isApp && navigator.canShare?.({ files: [datei] })) {
      try {
        await navigator.share({ files: [datei], title: place.name })
        return toast(t('gastro.qr.geteilt'))
      } catch (fehler) {
        if (fehler?.name === 'AbortError') return undefined
        /* Sonst weiter mit dem gewöhnlichen Weg. */
      }
    }

    const adresse = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = adresse
    link.download = `qr-${place.slug}.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(adresse)
    return toast(t('gastro.qr.speichernHinweis'))
  }

  return (
    <>
      <ConsoleHeader title={t('gastro.qr.title')} />
      <p className="t-body c-secondary" style={{ marginTop: 'calc(var(--sp-6) * -1)', marginBottom: 'var(--sp-6)', maxWidth: 560 }}>
        {t('gastro.qr.text')}
      </p>

      <div className="split" style={{ maxWidth: 860 }}>
        {/* Vorschau, und zugleich das, was gedruckt wird. */}
        <Card style={{ display: 'grid', justifyItems: 'center', gap: 'var(--sp-3)', padding: 'var(--sp-8)' }}>
          <div className={`qr-aushang qr-${template}`}>
            {bild
              ? <img className="qr-bild" src={bild} alt={t('gastro.qr.title')} width={240} height={240} />
              : <div className="qr-bild qr-leer" />}
            <p className="t-body-bold qr-name">{place.name}</p>
            {template !== 'plain' && <p className="t-small c-secondary qr-text">{text}</p>}
            <p className="t-tiny c-tertiary qr-adresse">{url}</p>
          </div>
          <p className="t-tiny c-tertiary" style={{ textAlign: 'center', maxWidth: 260 }}>
            {t('gastro.qr.scanHinweis')}
          </p>
        </Card>

        {/* Einstellungen */}
        <div className="stack-6">
          <div>
            <p className="field-label">{t('gastro.qr.templateLabel')}</p>
            <div style={{ display: 'grid', gap: 'var(--sp-2)', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  className="card"
                  onClick={() => setTemplate(tpl)}
                  aria-pressed={template === tpl}
                  style={{
                    textAlign: 'left', cursor: 'pointer',
                    borderColor: template === tpl ? 'var(--accent)' : 'var(--border)',
                    background: template === tpl ? 'var(--accent-soft)' : 'var(--bg-light)',
                  }}
                >
                  <span className="t-body-bold" style={{ display: 'block' }}>{t(`gastro.qr.templates.${tpl}Title`)}</span>
                  <span className="t-small c-secondary">{t(`gastro.qr.templates.${tpl}Text`)}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="field-label">{t('gastro.qr.targetLabel')}</p>
            <div className="seg">
              <button type="button" aria-pressed={target === 'place'} onClick={() => setTarget('place')}>
                {t('gastro.nav.profile')}
              </button>
              <button type="button" aria-pressed={target === 'menu'} onClick={() => setTarget('menu')}>
                {t('menu.title')}
              </button>
            </div>
          </div>

          <Field label={t('gastro.qr.textLabel')} count={charCount(text, 60)}>
            {(id) => <Input id={id} maxLength={60} value={text} onChange={(e) => setText(e.target.value)} />}
          </Field>

          {/*
            * Die Sprachauswahl ist weg. Es gibt genau eine Sprache, und ein
            * Auswahlfeld mit einer wirkungslosen zweiten Möglichkeit ist ein
            * Versprechen, das die App nicht hält.
            */}

          <div className="row-wrap">
            <Button variant="secondary" href={pfad}>{t('gastro.qr.preview')}</Button>
            <Button variant="secondary" onClick={kopieren}>{t('common.copy')}</Button>
            <Button variant="primary" onClick={() => window.print()} disabled={!bild}>
              {t('gastro.qr.drucken')}
            </Button>
            <Button variant="quiet" onClick={speichern} disabled={!bild}>
              {t('gastro.qr.speichern')}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
