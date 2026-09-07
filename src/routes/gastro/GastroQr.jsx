import { useState } from 'react'
import { QrCode } from 'lucide-react'
import { Button, Card, Field, Input, Select, charCount, useToast } from '../../design/ui'
import { GastroShell, useMyPlace } from './GastroShell'
import { ConsoleHeader } from '../../components/layout'
import { t } from '../../design/i18n'

const TEMPLATES = ['a6', 'a4', 'sticker', 'plain']

/** F.10 — Gastro-QR-Codes */
export default function GastroQr() {
  return (
    <GastroShell title={t('gastro.qr.title')}>
      <QrBody />
    </GastroShell>
  )
}

function QrBody() {
  const place = useMyPlace()
  const [template, setTemplate] = useState('a6')
  const [target, setTarget] = useState('place')
  const [text, setText] = useState(t('gastro.qr.textPlaceholder'))
  const toast = useToast()

  /* Der Code führt entweder auf die Gastro-Seite oder direkt in die Karte. */
  const path = target === 'menu' ? `/g/${place.slug}/speisekarte?src=qr` : `/g/${place.slug}?src=qr`
  const url = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}${path}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast(t('toast.linkCopied'))
    } catch {
      toast(t('toast.error'), 'error')
    }
  }

  return (
    <>
      <ConsoleHeader title={t('gastro.qr.title')} />
      <p className="t-body c-secondary" style={{ marginTop: 'calc(var(--sp-6) * -1)', marginBottom: 'var(--sp-6)', maxWidth: 560 }}>
        {t('gastro.qr.text')}
      </p>

      <div className="split" style={{ maxWidth: 860 }}>
        {/* Vorschau */}
        <Card style={{ display: 'grid', justifyItems: 'center', gap: 'var(--sp-3)', padding: 'var(--sp-8)' }}>
          <div
            style={{
              width: 240, height: 240, display: 'grid', placeItems: 'center',
              border: '1px solid var(--border)', borderRadius: 'var(--r-card)',
              background: '#fff', color: '#17171A',
            }}
          >
            <QrCode size={180} strokeWidth={1} />
          </div>
          <p className="t-body-bold">{place.name}</p>
          <p className="t-small c-secondary" style={{ textAlign: 'center' }}>{text}</p>
          <p className="t-tiny c-tertiary" style={{ textAlign: 'center', wordBreak: 'break-all' }}>{url}</p>
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

          <Field label={t('common.language')}>
            {(id) => <Select id={id} options={[t('common.german'), t('common.english')]} />}
          </Field>

          <div className="row-wrap">
            <Button variant="secondary" href={path}>{t('gastro.qr.preview')}</Button>
            <Button variant="secondary" onClick={copy}>{t('common.copy')}</Button>
            <Button variant="primary" onClick={() => toast(t('toast.noAction'), 'info')}>{t('gastro.qr.downloadPdf')}</Button>
            <Button variant="quiet" onClick={() => toast(t('toast.noAction'), 'info')}>{t('gastro.qr.downloadPng')}</Button>
          </div>
        </div>
      </div>
    </>
  )
}
