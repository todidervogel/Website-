import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell, ChevronRight, Cookie, Download, FileText, Globe, Lock, LogOut, Mail,
  MapPin, Moon, Phone, Scale, Shield, Smartphone, User, Video,
} from 'lucide-react'
import { Button, Field, Input, Switch, Textarea, charCount, useToast } from '../../design/ui'
import { Page, ThemeSegments } from '../../components/layout'
import { DeleteAccountDialog } from '../dialogs/DeleteAccountDialog'
import { useDesignState } from '../../lib/design-state'
import { useSession } from '../../lib/session'
import { api } from '../../lib/store'
import { rules, useForm } from '../../lib/form'
import { APP_VERSION, RADIUS_OPTIONS } from '../../design/config'
import { t } from '../../design/i18n'

/** Eine Zeile der Einstellungsliste: Symbol, Beschriftung, rechts Pfeil oder Schalter. */
function Row({ icon: Icon, label, hint, value, to, onClick, control }) {
  const inner = (
    <>
      {Icon && <Icon size={18} className="c-secondary" style={{ flex: 'none' }} />}
      <span className="grow">
        <span className="t-body">{label}</span>
        {hint && <span className="t-small c-secondary" style={{ display: 'block' }}>{hint}</span>}
      </span>
      {value && <span className="t-small c-tertiary">{value}</span>}
      {control ?? <ChevronRight size={18} className="c-tertiary" />}
    </>
  )
  if (control) return <div className="list-row list-row-static">{inner}</div>
  if (to) return <Link to={to} className="list-row">{inner}</Link>
  return <button type="button" className="list-row" onClick={onClick}>{inner}</button>
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="t-small c-secondary" style={{ marginBottom: 'var(--sp-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {title}
      </h2>
      <div className="list-group">{children}</div>
    </section>
  )
}

/** E.10, Einstellungen */
export default function Settings() {
  const { radiusKm, setRadiusKm } = useDesignState()
  const { user, logout, updateMe } = useSession()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [locationOn, setLocationOn] = useState(true)
  const [autoplay, setAutoplay] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  if (!user) return null

  const notify = user.notify ?? {}
  const setNotify = (key) => (value) => updateMe({ notify: { ...notify, [key]: value } })

  return (
    <Page title={t('settings.title')} footer={false}>
      <div style={{ paddingBlock: 'var(--sp-6) var(--sp-16)', maxWidth: 640 }} className="stack-8">
        <h1 className="t-h1">{t('settings.title')}</h1>

        <Section title={t('settings.sections.account')}>
          <Row icon={User} label={t('settings.editProfile')} to="/einstellungen/profil" />
          <Row icon={Mail} label={t('settings.email')} value={user.email} to="/einstellungen/profil" />
          <Row icon={Phone} label={t('settings.phone')} value={user.phone ?? '–'} to="/einstellungen/profil" />
          <Row icon={Lock} label={t('settings.changePassword')} to="/passwort-neu" />
        </Section>

        <Section title={t('settings.sections.privacy')}>
          <Row
            icon={Shield}
            label={t('settings.privateProfile')}
            hint={t('settings.privateProfileHint')}
            control={<Switch checked={!!user.private} onChange={(v) => updateMe({ private: v })} label={t('settings.privateProfile')} />}
          />
          <Row icon={User} label={t('settings.discoverable')} value={t('settings.discoverableOptions.all')} to="/einstellungen" />
          <Row icon={Lock} label={t('settings.blocked')} to="/einstellungen" />
          <Row
            icon={MapPin}
            label={t('settings.location')}
            hint={t('settings.locationHint')}
            control={<Switch checked={locationOn} onChange={setLocationOn} label={t('settings.location')} />}
          />
        </Section>

        {/* Der Dunkelmodus gilt für Website und App, nicht mehr nur für die App. */}
        <Section title={t('theme.label')}>
          <Row
            icon={Moon}
            label={t('theme.label')}
            hint={t('settings.appearanceHintAll')}
            control={<ThemeSegments />}
          />
        </Section>

        <Section title={t('settings.sections.content')}>
          <Row
            icon={MapPin}
            label={t('settings.defaultRadius')}
            control={
              <select
                className="select" style={{ width: 'auto', minHeight: 36 }}
                value={radiusKm}
                onChange={(e) => { const v = Number(e.target.value); setRadiusKm(v); updateMe({ radius: v }) }}
                aria-label={t('settings.defaultRadius')}
              >
                {RADIUS_OPTIONS.map((r) => <option key={r} value={r}>{r} km</option>)}
              </select>
            }
          />
          <Row icon={Globe} label={t('settings.language')} value={t('common.german')} to="/einstellungen" />
          <Row icon={Video} label={t('settings.videoQuality')} value={t('settings.videoQualityOptions.auto')} to="/einstellungen" />
          <Row
            icon={Smartphone}
            label={t('settings.autoplayMobile')}
            control={<Switch checked={autoplay} onChange={setAutoplay} label={t('settings.autoplayMobile')} />}
          />
        </Section>

        <Section title={t('settings.sections.notifications')}>
          {[
            ['follows', 'notifyFollowers'], ['likes', 'notifyLikes'], ['comments', 'notifyComments'],
            ['replies', 'notifyReplies'], ['news', 'notifyNews'],
          ].map(([key, labelKey]) => (
            <Row
              key={key}
              icon={Bell}
              label={t(`settings.${labelKey}`)}
              control={<Switch checked={!!notify[key]} onChange={setNotify(key)} label={t(`settings.${labelKey}`)} />}
            />
          ))}
        </Section>

        <Section title={t('settings.sections.data')}>
          <Row icon={Download} label={t('settings.downloadData')} to="/einstellungen/daten" />
          <Row icon={Cookie} label={t('settings.cookies')} to="/cookies" />
        </Section>

        <Section title={t('settings.sections.legal')}>
          <Row icon={FileText} label={t('settings.guidelines')} to="/richtlinien" />
          <Row icon={FileText} label={t('settings.terms')} to="/agb" />
          <Row icon={Shield} label={t('settings.privacy')} to="/datenschutz" />
          <Row icon={Scale} label={t('settings.imprint')} to="/impressum" />
        </Section>

        <Section title={t('settings.sections.help')}>
          <Row label={t('settings.helpCenter')} to="/einstellungen" />
          <Row label={t('settings.reportProblem')} to="/einstellungen" />
          <Row label={t('settings.about')} value={`Version ${APP_VERSION}`} to="/einstellungen" />
        </Section>

        <div className="stack-2" style={{ paddingTop: 'var(--sp-4)', borderTop: '1px solid var(--border)' }}>
          <Button
            variant="quiet" full icon={LogOut} style={{ color: 'var(--danger)' }}
            onClick={() => { logout(); toast(t('auth.loggedOut')); navigate('/anmelden', { replace: true }) }}
          >
            {t('settings.logout')}
          </Button>
          <Button variant="quiet" full style={{ color: 'var(--danger)' }} onClick={() => setDeleteOpen(true)}>
            {t('settings.deleteAccount')}
          </Button>
        </div>
      </div>

      <DeleteAccountDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </Page>
  )
}

/** E.9, Profil bearbeiten */
export function EditProfile() {
  const { user, updateMe } = useSession()
  const navigate = useNavigate()
  const toast = useToast()

  const form = useForm({
    initial: {
      name: user?.name ?? '',
      username: user?.username ?? '',
      bio: user?.bio ?? '',
      website: user?.website ?? '',
    },
    schema: {
      name: [rules.required(), rules.maxLength(40)],
      username: [rules.required(), rules.username()],
      bio: [rules.maxLength(150)],
      website: [rules.url()],
    },
    onSubmit: (values) => {
      updateMe({
        name: values.name.trim(),
        username: values.username.trim().toLowerCase(),
        bio: values.bio.trim(),
        website: values.website.trim(),
      })
      toast(t('settings.savedProfile'))
      navigate('/profil')
      return { ok: true }
    },
  })

  if (!user) return null

  return (
    <Page title={t('profile.editPage.title')} footer={false}>
      <form
        style={{ paddingBlock: 'var(--sp-6) var(--sp-16)', maxWidth: 480 }}
        className="stack-6"
        onSubmit={form.handleSubmit}
        noValidate
      >
        <h1 className="t-h1">{t('profile.editPage.title')}</h1>

        <div style={{ display: 'grid', justifyItems: 'center', gap: 'var(--sp-2)' }}>
          <button
            type="button"
            className="avatar-placeholder"
            style={{ width: 96, height: 96, fontSize: 13, cursor: 'pointer', position: 'relative' }}
          >
            {t('profile.editPage.changeImage')}
          </button>
          <Button variant="quiet" size="sm">{t('profile.editPage.removeImage')}</Button>
        </div>

        <div className="stack-4">
          <Field label={t('profile.editPage.displayName')} count={charCount(form.values.name, 40)} error={form.error('name')}>
            {(id) => <Input id={id} maxLength={40} {...form.field('name')} />}
          </Field>

          <Field label={t('profile.editPage.username')} hint={t('profile.editPage.usernameHint')} error={form.error('username')}>
            {(id) => (
              <div className="input-affix">
                <span className="affix">@</span>
                <input id={id} className="input" {...form.field('username')} />
              </div>
            )}
          </Field>

          <Field label={t('profile.editPage.bio')} count={charCount(form.values.bio, 150)} error={form.error('bio')}>
            {(id) => <Textarea id={id} rows={3} maxLength={150} {...form.field('bio')} />}
          </Field>

          <Field label={t('profile.editPage.website')} error={form.error('website')}>
            {(id) => <Input id={id} placeholder={t('profile.editPage.websitePlaceholder')} {...form.field('website')} />}
          </Field>
        </div>

        <div className="row">
          <Button type="submit" variant="primary" loading={form.submitting}>{t('common.save')}</Button>
          <Button variant="quiet" to="/profil">{t('common.cancel')}</Button>
        </div>
      </form>
    </Page>
  )
}

/** E.12, Meine Daten herunterladen (Art. 15/20 DSGVO) */
export function DataExport() {
  const { userId } = useSession()
  const [parts, setParts] = useState({ profile: true, videos: true, reviews: true, saved: true, activity: false })
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  /* Der Export ist echt: eine JSON-Datei, die der Browser herunterlädt. */
  const download = async () => {
    setBusy(true)
    const all = await api.users.exportData()
    setBusy(false)
    if (!all) return

    const selected = {
      exportiertAm: all.exportiertAm,
      ...(parts.profile ? { profil: all.profil } : {}),
      ...(parts.videos ? { videos: all.videos } : {}),
      ...(parts.reviews ? { bewertungen: all.bewertungen } : {}),
      ...(parts.saved ? { gespeichert: all.gespeichert } : {}),
      ...(parts.activity ? { gefaelltMir: all.gefaelltMir, folgt: all.folgt, folgen: all.folgen } : {}),
    }

    const blob = new Blob([JSON.stringify(selected, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `meine-daten-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    toast(t('settings.exportReady'))
  }

  return (
    <Page title={t('settings.dataPage.title')} footer={false}>
      <div style={{ paddingBlock: 'var(--sp-6) var(--sp-16)', maxWidth: 480 }} className="stack-6">
        <div>
          <h1 className="t-h1">{t('settings.dataPage.title')}</h1>
          <p className="t-body c-secondary" style={{ marginTop: 'var(--sp-2)' }}>{t('settings.dataPage.text')}</p>
        </div>

        <div className="stack-2">
          {Object.keys(parts).map((key) => (
            <label className="check" key={key}>
              <input
                type="checkbox"
                checked={parts[key]}
                onChange={(e) => setParts((p) => ({ ...p, [key]: e.target.checked }))}
              />
              <span className="check-text">{t(`settings.dataPage.${key}`)}</span>
            </label>
          ))}
        </div>

        <div>
          <Button variant="primary" loading={busy} onClick={download}>{t('settings.dataPage.submit')}</Button>
          <p className="t-small c-secondary" style={{ marginTop: 'var(--sp-3)' }}>{t('settings.dataPage.hint')}</p>
        </div>
      </div>
    </Page>
  )
}
