import { useState } from 'react'
import { Button, Field, Modal, ModalActions, Radio, Textarea, useToast } from '../../design/ui'
import { api } from '../../lib/store'
import { useSession } from '../../lib/session'
import { t } from '../../design/i18n'

const REASONS = ['spam', 'hate', 'fake', 'wrong', 'violence', 'sexual', 'copyright', 'other']

/** E.14 — Dialog „Melden“ (Video / Bewertung / Profil) */
export function ReportContentDialog({ open, onClose, target }) {
  const [reason, setReason] = useState('spam')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const { userId } = useSession()
  const toast = useToast()

  /* Die Meldung landet wirklich in der Warteschlange der Moderation (G.4). */
  const submit = async () => {
    setBusy(true)
    if (target) {
      await api.reports.create({
        targetType: target.type, targetId: target.id, label: target.label,
        reason, note, reporterId: userId,
      })
    }
    setBusy(false)
    setNote('')
    onClose?.()
    toast(t('toast.reportReceived'))
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('reportContent.title')}
      actions={
        <ModalActions onCancel={onClose}>
          <Button variant="primary" loading={busy} onClick={submit}>
            {t('reportContent.submit')}
          </Button>
        </ModalActions>
      }
    >
      <div className="stack-2">
        {REASONS.map((r) => (
          <Radio key={r} name="report-content" label={t(`reportContent.reasons.${r}`)} checked={reason === r} onChange={() => setReason(r)} />
        ))}
      </div>

      <div style={{ marginTop: 'var(--sp-4)' }}>
        <Field label={t('reportContent.explanationLabel')}>
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>

      <p className="t-small c-secondary" style={{ marginTop: 'var(--sp-3)' }}>{t('reportContent.hint')}</p>
    </Modal>
  )
}
