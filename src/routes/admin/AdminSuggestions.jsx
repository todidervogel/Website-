import { useState } from 'react'
import { Lightbulb, MapPin } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Select, useToast } from '../../design/ui'
import { AdminShell, AdminTable } from './AdminShell'
import { useVariant } from '../../lib/design-state'
import { api, useQuery } from '../../lib/store'
import { t } from '../../design/i18n'

const TONE = { open: 'warning', created: 'success', rejected: 'default' }
const REJECT_REASONS = ['notExist', 'duplicate', 'notGastro']

/** G.8 — Admin-Vorschläge (fehlende Betriebe aus E.4) */
export default function AdminSuggestions() {
  const [selectedId, setSelectedId] = useState(null)
  const [rejectReason, setRejectReason] = useState('notExist')
  const toast = useToast()

  const { data } = useVariant(useQuery(() => api.admin.suggestions(), [], { initial: [] }))
  const rows = data ?? []
  const selected = rows.find((s) => s.id === selectedId) ?? null

  const decide = async (status) => {
    await api.admin.resolveSuggestion(selected.id, status)
    setSelectedId(null)
    toast(t('common.saved'))
  }

  return (
    <AdminShell title={t('admin.suggestions.title')}>
      <h1 className="t-h1">{t('admin.suggestions.title')}</h1>
      <p className="t-small c-secondary" style={{ marginBottom: 'var(--sp-4)' }}>{t('admin.suggestions.intro')}</p>

      <div className="admin-split" style={{ gridTemplateColumns: selected ? '1fr 360px' : '1fr' }}>
        <AdminTable
          columns={[
            t('admin.suggestions.cols.name'), t('admin.suggestions.cols.address'), t('admin.suggestions.cols.type'),
            t('admin.suggestions.cols.reportedBy'), t('admin.suggestions.cols.date'), t('admin.suggestions.cols.status'), '',
          ]}
          rows={rows}
          empty={<EmptyState icon={Lightbulb} title={t('admin.reports.emptyTitle')} />}
          renderRow={(s) => (
            <tr key={s.id}>
              <td style={{ fontWeight: 600 }}>{s.name}</td>
              <td className="c-secondary">{s.address}</td>
              <td>{t(`categories.${s.type}`)}</td>
              <td className="c-secondary">@{s.reportedBy}</td>
              <td style={{ whiteSpace: 'nowrap' }}>{s.createdAt}</td>
              <td><Badge tone={TONE[s.status]}>{t(`admin.suggestions.status.${s.status}`)}</Badge></td>
              <td><Button variant="quiet" size="sm" onClick={() => setSelectedId(s.id)}>{t('common.view')}</Button></td>
            </tr>
          )}
        />

        {selected && (
          <Card className="stack-4">
            <div className="row-between">
              <h2 className="t-h2">{selected.name}</h2>
              <Button variant="quiet" size="sm" onClick={() => setSelectedId(null)}>{t('common.close')}</Button>
            </div>

            <p className="t-small c-secondary">{selected.address}</p>
            <div className="mini-map"><MapPin size={22} /></div>

            <div className="row-wrap">
              <Button variant="primary" size="sm" disabled={selected.status !== 'open'} onClick={() => decide('created')}>
                {t('admin.suggestions.create')}
              </Button>
            </div>

            <div>
              <p className="field-label">{t('admin.suggestions.reject')}</p>
              <div className="row" style={{ gap: 'var(--sp-2)' }}>
                <Select
                  options={REJECT_REASONS.map((r) => ({ value: r, label: t(`admin.suggestions.rejectReasons.${r}`) }))}
                  aria-label={t('admin.suggestions.reject')}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <Button variant="danger" size="sm" disabled={selected.status !== 'open'} onClick={() => decide('rejected')}>
                  {t('admin.suggestions.reject')}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </AdminShell>
  )
}
