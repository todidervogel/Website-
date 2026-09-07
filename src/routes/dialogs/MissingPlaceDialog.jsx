import { useState } from 'react'
import { Button, Field, Input, Modal, ModalActions, Select, Textarea, useToast } from '../../design/ui'
import { api } from '../../lib/store'
import { useSession } from '../../lib/session'
import { rules, useForm } from '../../lib/form'
import { t } from '../../design/i18n'

const TYPES = ['restaurant', 'cafe', 'bar', 'imbiss', 'baeckerei', 'eisdiele', 'pub', 'sonstiges']

/**
 * E.4 — Dialog „Restaurant fehlt“
 *
 * Nutzer legen keine Betriebe an (Konzept 8.5). Der Vorschlag landet
 * stattdessen in der Liste, die die Redaktion unter /admin/vorschlaege prüft.
 */
export function MissingPlaceDialog({ open, onClose }) {
  const { user } = useSession()
  const toast = useToast()
  const [sent, setSent] = useState(false)

  const form = useForm({
    initial: { name: '', address: '', type: 'restaurant', note: '' },
    schema: { name: [rules.required()], address: [rules.required()] },
    onSubmit: async (values) => {
      await api.admin.suggestPlace({
        name: values.name.trim(),
        address: values.address.trim(),
        type: values.type || 'sonstiges',
        note: values.note.trim(),
        reportedBy: user?.username ?? 'gast',
      })
      setSent(true)
      onClose?.()
      toast(t('toast.reportReceived'))
      return { ok: true }
    },
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('upload.missing.title')}
      description={t('upload.missing.text')}
      actions={
        <ModalActions onCancel={onClose}>
          <Button variant="primary" loading={form.submitting} onClick={form.handleSubmit}>
            {t('upload.missing.submit')}
          </Button>
        </ModalActions>
      }
    >
      <div className="stack-3">
        <Field label={t('upload.missing.name')} required error={form.error('name')}>
          {(id) => <Input id={id} placeholder={t('upload.missing.namePlaceholder')} {...form.field('name')} />}
        </Field>
        <Field label={t('upload.missing.address')} required error={form.error('address')}>
          {(id) => <Input id={id} placeholder={t('upload.missing.addressPlaceholder')} {...form.field('address')} />}
        </Field>
        <Field label={t('upload.missing.type')}>
          {(id) => (
            <Select
              id={id}
              options={TYPES.map((v) => ({ value: v, label: t(`categories.${v}`) }))}
              value={form.values.type}
              onChange={(e) => form.setValue('type', e.target.value)}
            />
          )}
        </Field>
        <Field label={t('upload.missing.note')}>
          {(id) => <Textarea id={id} rows={3} {...form.field('note')} />}
        </Field>
      </div>
      <p className="t-small c-secondary" style={{ marginTop: 'var(--sp-3)' }}>
        {sent ? t('toast.reportThanks') : t('upload.missing.hint')}
      </p>
    </Modal>
  )
}
