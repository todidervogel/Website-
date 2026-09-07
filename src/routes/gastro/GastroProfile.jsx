import { useState } from 'react'
import { Image, Plus } from 'lucide-react'
import {
  Button, Card, Checkbox, Chip, Field, Input, Modal, ModalActions, Notice,
  Select, ServingPicker, ServingRow, Switch, Textarea, charCount, useToast,
} from '../../design/ui'
import { GastroShell, useMyPlace } from './GastroShell'
import { ConsoleHeader } from '../../components/layout'
import { HoursEditor } from './HoursEditor'
import { api } from '../../lib/store'
import { SERVING_KEYS } from '../../design/vocabulary'
import { PRICE_LEVELS } from '../../design/config'
import { t } from '../../design/i18n'

const CUISINES = ['Italienisch', 'Deutsch', 'Asiatisch', 'Vietnamesisch', 'Türkisch', 'Griechisch', 'Vegetarisch', 'Fusion', 'Japanisch', 'Vegan', 'Café', 'Bar', 'Bäckerei', 'Eisdiele']
const FEATURES = [
  'barrierefrei', 'aussenplaetze', 'vegetarisch', 'vegan', 'glutenfrei', 'hunde',
  'wlan', 'reservierung', 'kartenzahlung', 'parkplaetze', 'lieferung', 'abholung',
]

/** F.9 — Gastro-Profil */
export default function GastroProfile() {
  return (
    <GastroShell title={t('gastro.profile.title')}>
      <ProfileBody />
    </GastroShell>
  )
}

function ProfileBody() {
  const place = useMyPlace()
  const toast = useToast()
  const [specialOpen, setSpecialOpen] = useState(false)

  /* Ein Entwurf, der erst beim Speichern in die Daten wandert. */
  const [draft, setDraft] = useState({
    name: place.name,
    address: place.address,
    zip: place.zip,
    city: place.city,
    phone: place.phone ?? '',
    website: place.website ?? '',
    description: place.description ?? '',
    tags: place.tags ?? [],
    price: place.price,
    serving: place.serving ?? [],
    features: place.features ?? [],
    hours: place.hours ?? {},
    menuNote: place.menuNote ?? '',
  })

  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }))

  const saveSection = async (keys) => {
    await api.places.save(place.id, Object.fromEntries(keys.map((k) => [k, draft[k]])))
    toast(t('common.saved'))
  }

  const toggle = (key, value) =>
    setDraft((d) => ({
      ...d,
      [key]: d[key].includes(value) ? d[key].filter((x) => x !== value) : [...d[key], value],
    }))

  const Section = ({ title, keys, children }) => (
    <section>
      <div className="row-between" style={{ marginBottom: 'var(--sp-3)' }}>
        <h2 className="t-h2">{title}</h2>
        <Button variant="secondary" size="sm" onClick={() => saveSection(keys)}>{t('common.save')}</Button>
      </div>
      <Card className="stack-4">{children}</Card>
    </section>
  )

  return (
    <>
      <ConsoleHeader title={t('gastro.profile.title')} />

      <div className="stack-8" style={{ maxWidth: 760 }}>
        <Section title={t('gastro.profile.sectionBase')} keys={['name', 'address', 'zip', 'city', 'phone', 'website']}>
          <Field label={t('gastro.profile.name')} required>
            {(id) => <Input id={id} value={draft.name} onChange={(e) => set('name')(e.target.value)} />}
          </Field>
          <Field label={t('gastro.profile.street')} required>
            {(id) => <Input id={id} value={draft.address} onChange={(e) => set('address')(e.target.value)} />}
          </Field>
          <div className="row" style={{ gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
            <Field label={t('gastro.profile.zip')} required className="grow">
              {(id) => <Input id={id} value={draft.zip} onChange={(e) => set('zip')(e.target.value)} />}
            </Field>
            <Field label={t('gastro.profile.city')} required className="grow">
              {(id) => <Input id={id} value={draft.city} onChange={(e) => set('city')(e.target.value)} />}
            </Field>
          </div>
          <Field label={t('gastro.profile.country')} required>
            {(id) => <Select id={id} options={['Deutschland', 'Österreich', 'Schweiz']} />}
          </Field>
          <Field label={t('gastro.profile.phone')}>
            {(id) => <Input id={id} type="tel" value={draft.phone} onChange={(e) => set('phone')(e.target.value)} />}
          </Field>
          <Field label={t('gastro.profile.website')}>
            {(id) => <Input id={id} value={draft.website} onChange={(e) => set('website')(e.target.value)} />}
          </Field>
          <Notice>{t('gastro.profile.baseNotice')}</Notice>
        </Section>

        {/* Das Angebot steht bei Gästen ganz oben — deshalb ein eigener Abschnitt. */}
        <Section title={t('serving.editTitle')} keys={['serving']}>
          <p className="t-small c-secondary">{t('serving.editHint')}</p>
          <ServingPicker value={draft.serving} onChange={set('serving')} keys={SERVING_KEYS} />
          <div>
            <p className="field-label">{t('common.view')}</p>
            <ServingRow serving={draft.serving} size="md" />
          </div>
        </Section>

        <Section title={t('gastro.profile.sectionDescription')} keys={['description', 'tags', 'price', 'menuNote']}>
          <Field label={t('gastro.profile.about')} count={charCount(draft.description, 500)}>
            {(id) => (
              <Textarea
                id={id} rows={6} maxLength={500}
                value={draft.description}
                onChange={(e) => set('description')(e.target.value)}
              />
            )}
          </Field>

          <Field label={t('gastro.profile.cuisine')}>
            <div className="row-wrap">
              {CUISINES.map((c) => (
                <Chip key={c} active={draft.tags.includes(c)} onClick={() => toggle('tags', c)}>{c}</Chip>
              ))}
            </div>
          </Field>

          <Field label={t('gastro.profile.priceRange')}>
            <div className="row" style={{ gap: 'var(--sp-2)' }}>
              {PRICE_LEVELS.map((p) => (
                <Button key={p} variant={draft.price === p ? 'primary' : 'secondary'} onClick={() => set('price')(p)}>{p}</Button>
              ))}
            </div>
          </Field>

          <Field label={t('gastro.menu.noteLabel')} hint={t('menu.updatedHint')}>
            {(id) => (
              <Input
                id={id}
                placeholder={t('gastro.menu.notePlaceholder')}
                value={draft.menuNote}
                onChange={(e) => set('menuNote')(e.target.value)}
              />
            )}
          </Field>
        </Section>

        <Section title={t('gastro.profile.sectionImages')} keys={[]}>
          <Field label={t('gastro.profile.cover')}>
            <div className="cover" style={{ borderRadius: 'var(--r-card)', height: 200 }}>
              <Image size={32} />
            </div>
            <div className="row" style={{ marginTop: 'var(--sp-2)' }}>
              <Button variant="secondary" size="sm">{t('gastro.profile.replace')}</Button>
              <Button variant="quiet" size="sm">{t('gastro.profile.remove')}</Button>
            </div>
          </Field>

          <Field label={t('gastro.profile.moreImages')} hint={t('gastro.profile.moreImagesHint')}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 'var(--sp-2)' }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className="thumb-placeholder" style={{ aspectRatio: '1', width: '100%', height: 'auto' }}>
                  <Image size={20} />
                </span>
              ))}
              <button type="button" className="dropzone dropzone-sm" style={{ aspectRatio: '1' }}>
                <Plus size={20} />
              </button>
            </div>
          </Field>
        </Section>

        <Section title={t('gastro.profile.sectionHours')} keys={['hours']}>
          <HoursEditor value={draft.hours} onChange={set('hours')} />
          <Button variant="secondary" onClick={() => setSpecialOpen(true)}>{t('gastro.profile.addSpecialHours')}</Button>
        </Section>

        <Section title={t('gastro.profile.sectionFeatures')} keys={['features']}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 var(--sp-4)' }}>
            {FEATURES.map((f) => (
              <Checkbox
                key={f}
                label={t(`features.${f}`)}
                checked={draft.features.includes(f)}
                onChange={() => toggle('features', f)}
              />
            ))}
          </div>
        </Section>
      </div>

      <SpecialHoursDialog open={specialOpen} onClose={() => setSpecialOpen(false)} />
    </>
  )
}

function SpecialHoursDialog({ open, onClose }) {
  const [closed, setClosed] = useState(true)
  const toast = useToast()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('gastro.profile.specialDialog.title')}
      actions={
        <ModalActions onCancel={onClose}>
          <Button variant="primary" onClick={() => { onClose(); toast(t('common.saved')) }}>{t('common.save')}</Button>
        </ModalActions>
      }
    >
      <div className="stack-3">
        <Field label={t('gastro.profile.specialDialog.date')} required>
          {(id) => <Input id={id} type="date" />}
        </Field>
        <div className="row-between">
          <span className="t-body">{t('gastro.profile.specialDialog.closed')}</span>
          <Switch checked={closed} onChange={setClosed} label={t('gastro.profile.specialDialog.closed')} />
        </div>
        {!closed && (
          <div className="row" style={{ gap: 'var(--sp-2)' }}>
            <input className="input" type="time" defaultValue="12:00" aria-label={t('hours.from')} />
            <span className="c-secondary">–</span>
            <input className="input" type="time" defaultValue="18:00" aria-label={t('hours.to')} />
          </div>
        )}
        <Field label={t('gastro.profile.specialDialog.reason')}>
          {(id) => <Input id={id} placeholder="z. B. Heiligabend" />}
        </Field>
      </div>
    </Modal>
  )
}
