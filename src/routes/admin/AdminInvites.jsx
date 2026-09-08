import { useState } from 'react'
import { AlertTriangle, Mail } from 'lucide-react'
import {
  Badge, Button, Card, EmptyState, Field, Input, Modal, ModalActions, Notice, Select, useToast,
} from '../../design/ui'
import { AdminShell, AdminTable } from './AdminShell'
import { api, useQuery } from '../../lib/store'
import { rules, useForm } from '../../lib/form'
import { t } from '../../design/i18n'

const TONE = { sent: 'default', opened: 'accent', activated: 'success', bounced: 'danger', declined: 'warning' }

/** G.6, Admin-Einladungen */
export default function AdminInvites() {
  const [open, setOpen] = useState(false)
  const toast = useToast()

  const { data } = useQuery(() => api.admin.invites(), [], { initial: [] })
  const { data: places } = useQuery(() => api.admin.places(), [], { initial: [] })
  const rows = data ?? []

  const form = useForm({
    initial: { placeId: '', email: '', sender: 'Ana vom Team' },
    schema: { email: [rules.required(), rules.email()] },
    onSubmit: async (values) => {
      await api.admin.createInvite(values.placeId || null, values.email.trim())
      setOpen(false)
      toast(t('common.saved'))
      return { ok: true }
    },
  })

  return (
    <AdminShell title={t('admin.invites.title')}>
      <div className="row-between" style={{ marginBottom: 'var(--sp-4)' }}>
        <h1 className="t-h1">{t('admin.invites.title')}</h1>
        <Button variant="primary" size="sm" onClick={() => setOpen(true)}>{t('admin.invites.send')}</Button>
      </div>

      <AdminTable
        columns={[
          t('admin.invites.cols.place'), t('admin.invites.cols.email'), t('admin.invites.cols.sentAt'),
          t('admin.invites.cols.status'), t('admin.invites.cols.action'),
        ]}
        rows={rows}
        empty={<EmptyState icon={Mail} title={t('admin.reports.emptyTitle')} />}
        renderRow={(i) => (
          <tr key={i.id}>
            <td style={{ fontWeight: 600 }}>{i.placeName ?? '–'}</td>
            <td className="c-secondary">{i.email}</td>
            <td style={{ whiteSpace: 'nowrap' }}>{i.sentAt}</td>
            <td><Badge tone={TONE[i.status]}>{t(`admin.invites.status.${i.status}`)}</Badge></td>
            <td>
              <Button variant="quiet" size="sm" onClick={async () => { await api.admin.resendInvite(i.id); toast(t('common.saved')) }}>
                {t('admin.invites.resend')}
              </Button>
            </td>
          </tr>
        )}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        wide
        title={t('admin.invites.dialogTitle')}
        actions={
          <ModalActions onCancel={() => setOpen(false)}>
            <Button variant="primary" loading={form.submitting} onClick={form.handleSubmit}>
              {t('admin.invites.sendNow')}
            </Button>
          </ModalActions>
        }
      >
        <div className="stack-4">
          <div className="row" style={{ gap: 'var(--sp-3)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <Field label={t('admin.invites.cols.place')} className="grow">
              {(id) => (
                <Select
                  id={id}
                  placeholder="–"
                  options={(places ?? []).map((p) => ({ value: p.id, label: `${p.name} · ${p.city}` }))}
                  value={form.values.placeId}
                  onChange={(e) => form.setValue('placeId', e.target.value)}
                />
              )}
            </Field>
            <Field label={t('admin.invites.cols.email')} className="grow" error={form.error('email')}>
              {(id) => <Input id={id} type="email" placeholder={t('auth.register.emailPlaceholder')} {...form.field('email')} />}
            </Field>
          </div>

          <Field label={t('admin.invites.senderLabel')}>
            {(id) => <Input id={id} {...form.field('sender')} />}
          </Field>

          <div>
            <p className="field-label">{t('admin.invites.emailPreview')}</p>
            <Card flat className="stack-2">
              <p className="t-body-bold">Dein Betrieb ist schon dabei</p>
              <p className="t-small c-secondary">
                Hallo, wir haben dein Profil aus öffentlichen Daten angelegt. Du kannst es kostenlos übernehmen,
                Videos hochladen und auf Bewertungen antworten.
              </p>
            </Card>
          </div>

          <Notice tone="danger" icon={AlertTriangle}>
            <strong>⚠️ {t('admin.invites.legalWarning')}</strong>
          </Notice>
        </div>
      </Modal>
    </AdminShell>
  )
}
