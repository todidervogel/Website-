import { useState } from 'react'
import { Flag } from 'lucide-react'
import {
  Badge, Button, Card, Chip, EmptyState, Field, Select, Textarea, useToast,
} from '../../design/ui'
import { AdminShell, AdminTable } from './AdminShell'
import { useSession } from '../../lib/session'
import { api, useQuery } from '../../lib/store'
import { t } from '../../design/i18n'

const STATUS_TONE = { open: 'warning', in_review: 'accent', resolved: 'success', dismissed: 'default' }
const STATUS_KEY = { open: 'open', in_review: 'review', resolved: 'done', dismissed: 'rejected' }
const FILTERS = ['open', 'in_review', 'resolved', 'dismissed']

/** G.4, Admin-Meldungen */
export default function AdminReports() {
  const { userId } = useSession()
  const [filter, setFilter] = useState('open')
  const [selectedId, setSelectedId] = useState(null)
  const [note, setNote] = useState('')
  const toast = useToast()

  const { data } = useQuery(() => api.reports.list(), [], { initial: [] })
  const all = data ?? []
  const rows = all.filter((r) => r.status === filter)
  const selected = all.find((r) => r.id === selectedId) ?? null

  const decide = async (status) => {
    await api.reports.resolve(selected.id, status)
    setSelectedId(null)
    setNote('')
    toast(t('common.saved'))
  }

  /* Inhalt entfernen heißt: das Video verschwindet und die Meldung ist erledigt. */
  const removeContent = async () => {
    if (selected.targetType === 'video') await api.videos.moderate(selected.targetId, 'rejected', selected.reason)
    if (selected.targetType === 'place') await api.places.setStatus(selected.targetId, 'closing')
    await decide('resolved')
  }

  return (
    <AdminShell title={t('admin.reports.title')}>
      <h1 className="t-h1" style={{ marginBottom: 'var(--sp-4)' }}>{t('admin.reports.title')}</h1>

      <div className="row-between" style={{ marginBottom: 'var(--sp-4)', flexWrap: 'wrap' }}>
        <div className="row-wrap">
          {FILTERS.map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {t(`admin.reports.status.${STATUS_KEY[f]}`)} ({all.filter((r) => r.status === f).length})
            </Chip>
          ))}
        </div>
        <Select
          style={{ width: 'auto', minHeight: 34 }}
          placeholder={t('admin.reports.cols.type')}
          options={['video', 'review', 'profile', 'place'].map((v) => ({ value: v, label: t(`admin.reports.types.${v}`) }))}
          aria-label={t('admin.reports.cols.type')}
        />
      </div>

      <div className="admin-split" style={{ gridTemplateColumns: selected ? '1fr 380px' : '1fr' }}>
        <AdminTable
          columns={[
            t('admin.reports.cols.date'), t('admin.reports.cols.type'), t('admin.reports.cols.object'),
            t('admin.reports.cols.reason'), t('admin.reports.cols.count'), t('admin.reports.cols.status'),
            t('admin.reports.cols.action'),
          ]}
          rows={rows}
          empty={<EmptyState icon={Flag} title={t('admin.reports.emptyTitle')} />}
          renderRow={(r) => (
            <tr key={r.id}>
              <td style={{ whiteSpace: 'nowrap' }}>{r.createdAt}</td>
              <td>{t(`admin.reports.types.${r.targetType}`)}</td>
              <td>{r.label}</td>
              <td>{t(`reportReasons.${r.reason}`)}</td>
              <td>{r.count}</td>
              <td><Badge tone={STATUS_TONE[r.status]}>{t(`admin.reports.status.${STATUS_KEY[r.status]}`)}</Badge></td>
              <td>
                <Button variant="quiet" size="sm" onClick={() => setSelectedId(r.id)}>{t('common.view')}</Button>
              </td>
            </tr>
          )}
        />

        {selected && (
          <Card className="stack-4">
            <div className="row-between">
              <h2 className="t-h2">{selected.label}</h2>
              <Button variant="quiet" size="sm" onClick={() => setSelectedId(null)}>{t('common.close')}</Button>
            </div>

            <div className="card card-flat">
              <p className="t-small c-secondary">{t('admin.reports.cols.object')}</p>
              <p className="t-body">{selected.label}</p>
              {selected.note && <p className="t-small c-secondary">{selected.note}</p>}
            </div>

            <div className="stack-2">
              {Array.from({ length: selected.count }).map((_, i) => (
                <div className="card card-flat" key={i}>
                  <p className="t-small">{t(`reportReasons.${selected.reason}`)}</p>
                  <p className="t-small c-secondary">{selected.createdAt} · anonym</p>
                </div>
              ))}
            </div>

            {selected.reason === 'venue_closed' && (
              <div className="card card-flat stack-2">
                <p className="t-body-bold">{t('admin.reports.closedTitle')}</p>
                <p className="t-small c-secondary">{t('admin.reports.closedCount', { count: selected.count })}</p>
                <div className="row-wrap">
                  <Button
                    variant="secondary" size="sm"
                    onClick={async () => { await api.places.setStatus(selected.targetId, 'closing'); await decide('resolved') }}
                  >
                    {t('admin.reports.markClosed')}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => decide('in_review')}>{t('admin.reports.requestCheck')}</Button>
                  <Button variant="quiet" size="sm" onClick={() => decide('dismissed')}>{t('admin.reports.dismiss')}</Button>
                </div>
              </div>
            )}

            <div className="row-wrap">
              <Button variant="danger" size="sm" onClick={removeContent}>{t('admin.reports.removeContent')}</Button>
              <Button
                variant="secondary" size="sm"
                disabled={selected.targetType !== 'profile'}
                onClick={async () => { await api.users.setStatus(selected.targetId, 'warned'); await decide('resolved') }}
              >
                {t('admin.reports.warnUser')}
              </Button>
              <Button
                variant="danger" size="sm"
                disabled={selected.targetType !== 'profile'}
                onClick={async () => { await api.users.setStatus(selected.targetId, 'banned'); await decide('resolved') }}
              >
                {t('admin.reports.banUser')}
              </Button>
              <Button variant="quiet" size="sm" onClick={() => decide('dismissed')}>{t('admin.reports.dismiss')}</Button>
            </div>

            <Field label={t('admin.reports.noteLabel')}>
              {(id) => <Textarea id={id} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />}
            </Field>
          </Card>
        )}
      </div>
    </AdminShell>
  )
}
