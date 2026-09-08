import { useState } from 'react'
import { Button, Field, Modal, ModalActions, Radio, Textarea, charCount, useToast } from '../../design/ui'
import { api } from '../../lib/store'
import { useSession } from '../../lib/session'
import { t } from '../../design/i18n'

const REASONS = ['closed', 'address', 'hours', 'contact', 'notExist', 'other']

/** C.4, Dialog „Problem melden“ (Betrieb) */
export function ReportPlaceDialog({ open, onClose, place }) {
  const [reason, setReason] = useState('closed')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const { userId } = useSession()
  const toast = useToast()

  /**
   * Ab drei unabhängigen Meldungen „dauerhaft geschlossen" bekommt der Betrieb
   * den Status closed_reported und landet als Aufgabe bei der Moderation (8.7).
   */
  const submit = async () => {
    if (!place) return
    setBusy(true)
    await api.reports.create({
      targetType: 'place',
      targetId: place.id,
      label: place.name,
      reason: reason === 'closed' || reason === 'notExist' ? 'venue_closed' : 'wrong_info',
      note: `${t(`reportPlace.reasons.${reason}`)}${text ? `, ${text}` : ''}`,
      reporterId: userId,
    })
    setBusy(false)
    setText('')
    onClose?.()
    toast(t('toast.reportThanks'))
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('reportPlace.title')}
      actions={
        <ModalActions onCancel={onClose}>
          <Button variant="primary" loading={busy} onClick={submit}>{t('reportPlace.submit')}</Button>
        </ModalActions>
      }
    >
      <div className="stack-2">
        {REASONS.map((r) => (
          <Radio
            key={r}
            name="report-place"
            label={t(`reportPlace.reasons.${r}`)}
            checked={reason === r}
            onChange={() => setReason(r)}
          />
        ))}
      </div>

      <div style={{ marginTop: 'var(--sp-4)' }}>
        <Field label={t('reportPlace.explanationLabel')} count={charCount(text, 500)}>
          <Textarea
            rows={4}
            maxLength={500}
            placeholder={t('reportPlace.explanationPlaceholder')}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </Field>
      </div>

      <p className="t-small c-secondary" style={{ marginTop: 'var(--sp-3)' }}>{t('reportPlace.hint')}</p>
    </Modal>
  )
}
