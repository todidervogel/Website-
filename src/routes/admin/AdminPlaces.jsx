import { useState } from 'react'
import { Building2, Search } from 'lucide-react'
import { Badge, Button, EmptyState, Select, useToast } from '../../design/ui'
import { AdminShell, AdminTable } from './AdminShell'
import { api, useQuery } from '../../lib/store'
import { t } from '../../design/i18n'

const STATUSES = ['unclaimed', 'pending', 'verified', 'reportedClosed', 'closing', 'archived']
const TONE = { unclaimed: 'default', pending: 'warning', verified: 'success', reportedClosed: 'danger', closing: 'danger', archived: 'default' }

/** Der angezeigte Zustand ergibt sich aus Betriebsstatus und Übernahme. */
function statusOf(place) {
  if (place.status === 'archived') return 'archived'
  if (place.status === 'closing') return 'closing'
  if (place.status === 'closed_reported') return 'reportedClosed'
  if (place.claimStatus === 'verified') return 'verified'
  if (place.claimStatus === 'pending') return 'pending'
  return 'unclaimed'
}

/** G.5 — Admin-Betriebe */
export default function AdminPlaces() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const toast = useToast()

  const { data } = useQuery(() => api.admin.places(), [], { initial: [] })
  const rows = (data ?? [])
    .filter((p) => !query || `${p.name} ${p.city}`.toLowerCase().includes(query.toLowerCase()))
    .filter((p) => !statusFilter || statusOf(p) === statusFilter)

  const verify = async (place) => {
    await api.admin.setClaimStatus(place.id, 'verified')
    toast(t('common.saved'))
  }

  const archive = async (place) => {
    await api.places.setStatus(place.id, place.status === 'archived' ? 'active' : 'archived')
    toast(t('common.saved'))
  }

  return (
    <AdminShell title={t('admin.places.title')}>
      <h1 className="t-h1" style={{ marginBottom: 'var(--sp-4)' }}>{t('admin.places.title')}</h1>

      <div className="row-wrap" style={{ marginBottom: 'var(--sp-4)' }}>
        <div className="header-search grow" style={{ maxWidth: 320 }}>
          <Search size={16} className="search-icon" />
          <input
            className="input" style={{ height: 36, minHeight: 36 }}
            placeholder={t('common.search')} aria-label={t('common.search')}
            value={query} onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select
          style={{ width: 'auto', minHeight: 36 }}
          placeholder={t('admin.places.cols.status')}
          options={[{ value: '', label: t('common.all') }, ...STATUSES.map((s) => ({ value: s, label: t(`admin.places.status.${s}`) }))]}
          aria-label={t('admin.places.cols.status')}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
      </div>

      <AdminTable
        columns={[
          t('admin.places.cols.name'), t('admin.places.cols.city'), t('admin.places.cols.status'),
          t('admin.places.cols.claimedBy'), t('admin.places.cols.videos'), t('admin.places.cols.reviews'),
          t('admin.places.cols.lastActive'), '',
        ]}
        rows={rows}
        empty={<EmptyState icon={Building2} title={t('admin.reports.emptyTitle')} />}
        renderRow={(p) => {
          const status = statusOf(p)
          return (
            <tr key={p.id}>
              <td style={{ fontWeight: 600 }}>{p.name}</td>
              <td>{p.city}</td>
              <td><Badge tone={TONE[status]}>{t(`admin.places.status.${status}`)}</Badge></td>
              <td className="c-secondary">{p.claimedBy ?? '—'}</td>
              <td>{p.videoCount}</td>
              <td>{p.reviewCount}</td>
              <td className="c-secondary" style={{ whiteSpace: 'nowrap' }}>{p.osmId}</td>
              <td>
                <div className="row" style={{ gap: 0, flexWrap: 'nowrap' }}>
                  <Button variant="quiet" size="sm" to={`/g/${p.slug}`}>{t('admin.places.actions.view')}</Button>
                  <Button variant="quiet" size="sm" to={`/g/${p.slug}/speisekarte`}>{t('menu.title')}</Button>
                  <Button variant="quiet" size="sm" disabled={status === 'verified'} onClick={() => verify(p)}>
                    {t('admin.places.actions.verify')}
                  </Button>
                  <Button variant="quiet" size="sm" onClick={() => archive(p)}>
                    {status === 'archived' ? t('common.show') : t('admin.places.actions.archive')}
                  </Button>
                </div>
              </td>
            </tr>
          )
        }}
      />
    </AdminShell>
  )
}
