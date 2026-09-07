import { useState } from 'react'
import { CheckCircle2, Image, Video } from 'lucide-react'
import {
  Button, Card, Checkbox, Dropzone, EmptyState, Field, LoadingBlock, ServingPicker,
  Textarea, charCount, useToast,
} from '../../design/ui'
import { CenteredPage } from '../../components/layout'
import { HoursEditor } from './HoursEditor'
import { useSession } from '../../lib/session'
import { api, useQuery } from '../../lib/store'
import { SERVING_KEYS } from '../../design/vocabulary'
import { t } from '../../design/i18n'

const FEATURES = [
  'barrierefrei', 'aussenplaetze', 'vegetarisch', 'vegan', 'glutenfrei', 'hunde',
  'wlan', 'reservierung', 'kartenzahlung', 'parkplaetze', 'lieferung', 'abholung',
]

/** F.3 — Einrichtungsassistent */
export default function GastroSetup() {
  const { placeId } = useSession()
  const toast = useToast()
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState(null)
  const total = 4

  const { data: place, loading } = useQuery(
    () => (placeId ? api.places.byId(placeId) : api.places.bySlug('trattoria-bella')),
    [placeId],
  )

  /* Der Entwurf entsteht, sobald der Betrieb geladen ist. */
  if (place && !draft) {
    setDraft({
      description: place.description ?? '',
      features: place.features ?? [],
      serving: place.serving ?? [],
      hours: place.hours ?? {},
    })
  }

  if (loading || !place || !draft) {
    return (
      <CenteredPage title={t('gastro.setup.s2Title')} headerSuffix={t('gastro.brandSuffix')} minimalHeader width={640}>
        <LoadingBlock />
      </CenteredPage>
    )
  }

  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }))
  const toggle = (key, value) =>
    setDraft((d) => ({
      ...d,
      [key]: d[key].includes(value) ? d[key].filter((x) => x !== value) : [...d[key], value],
    }))

  const finish = async () => {
    await api.places.save(place.id, draft)
    toast(t('common.saved'))
    setStep(total + 1)
  }

  if (step > total) {
    return (
      <CenteredPage title={t('gastro.setup.doneTitle')} headerSuffix={t('gastro.brandSuffix')} minimalHeader width={480}>
        <EmptyState
          icon={CheckCircle2}
          title={t('gastro.setup.doneTitle')}
          text={t('gastro.setup.doneText')}
          action={<Button variant="primary" to="/gastro">{t('gastro.setup.doneDashboard')}</Button>}
          secondaryAction={<Button variant="secondary" to={`/g/${place.slug}`}>{t('gastro.setup.doneView')}</Button>}
        />
      </CenteredPage>
    )
  }

  return (
    <CenteredPage title={t('gastro.setup.s2Title')} headerSuffix={t('gastro.brandSuffix')} minimalHeader width={640}>
      {/* Fortschrittsanzeige */}
      <div className="row" style={{ gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)' }}>
        <span className="t-small c-secondary">{t('gastro.setup.step', { current: step, total })}</span>
        <div className="row grow" style={{ gap: 6 }}>
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              style={{
                height: 6, flex: 1, borderRadius: 'var(--r-pill)',
                background: i < step ? 'var(--accent)' : 'var(--border)',
              }}
            />
          ))}
        </div>
      </div>

      {step === 1 && (
        <section className="stack-4">
          <h2 className="t-h2">{t('gastro.setup.s1Title')}</h2>
          <Card flat className="stack-2">
            <p className="t-body-bold">{place.name}</p>
            <p className="t-body c-secondary">{place.address}, {place.zip} {place.city}</p>
            <p className="t-body c-secondary">{t(`categories.${place.category}`)}</p>
            <p className="t-body c-secondary">{place.phone}</p>
          </Card>
          <p className="t-small c-secondary">{t('gastro.setup.s1Source')}</p>
          <div className="row">
            <Button variant="primary" onClick={() => setStep(2)}>{t('gastro.setup.s1Confirm')}</Button>
            <Button variant="secondary" onClick={() => setStep(2)}>{t('gastro.setup.s1Deny')}</Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="stack-6">
          <h2 className="t-h2">{t('gastro.setup.s2Title')}</h2>

          <Field label={t('gastro.setup.descriptionLabel')} count={charCount(draft.description, 500)}>
            {(id) => (
              <Textarea
                id={id}
                rows={5}
                maxLength={500}
                placeholder={t('gastro.setup.descriptionPlaceholder')}
                value={draft.description}
                onChange={(e) => set('description')(e.target.value)}
              />
            )}
          </Field>

          {/* Angebot gleich mit abfragen — es ist das Erste, was Gäste sehen. */}
          <Field label={t('serving.editTitle')} hint={t('serving.editHint')}>
            <ServingPicker value={draft.serving} onChange={set('serving')} keys={SERVING_KEYS} />
          </Field>

          <Field label={t('gastro.setup.coverLabel')}>
            <Dropzone icon={Image} text={t('gastro.setup.dropImage')} hint={t('gastro.setup.imageHint')} />
          </Field>

          <div>
            <p className="field-label">{t('gastro.setup.featuresLabel')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0 var(--sp-4)' }}>
              {FEATURES.map((f) => (
                <Checkbox
                  key={f}
                  label={t(`features.${f}`)}
                  checked={draft.features.includes(f)}
                  onChange={() => toggle('features', f)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="stack-4">
          <h2 className="t-h2">{t('gastro.setup.s3Title')}</h2>
          <HoursEditor value={draft.hours} onChange={set('hours')} />
        </section>
      )}

      {step === 4 && (
        <section className="stack-4">
          <h2 className="t-h2">{t('gastro.setup.s4Title')}</h2>
          <Dropzone icon={Video} text={t('gastro.setup.dropVideo')} hint={t('gastro.setup.videoHint')} />
          <Button variant="quiet" onClick={finish} style={{ marginLeft: -8 }}>
            {t('gastro.setup.uploadLater')}
          </Button>
        </section>
      )}

      {/* Fußzeile jedes Schritts */}
      <div className="wizard-footer">
        <Button variant="secondary" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>{t('common.back')}</Button>
        <Button variant="quiet" onClick={() => setStep((s) => s + 1)}>{t('common.later')}</Button>
        <span className="spacer" />
        <Button variant="primary" onClick={() => (step === total ? finish() : setStep((s) => s + 1))}>
          {step === total ? t('common.done') : t('common.next')}
        </Button>
      </div>
    </CenteredPage>
  )
}
