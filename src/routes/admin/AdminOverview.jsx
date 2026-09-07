import { AdminShell, AdminTable } from './AdminShell'
import { Kpi } from '../../components/layout'
import { Skeleton } from '../../design/ui'
import { useVariant } from '../../lib/design-state'
import { api, useQuery } from '../../lib/store'
import { t } from '../../design/i18n'

/** G.2 — Admin-Übersicht */
export default function AdminOverview() {
  const { data, loading } = useVariant(useQuery(() => api.admin.overview(), []))
  const k = data ?? { queue: 0, reports: 0, claims: 0, places: 0, users: 0, videos: 0, log: [] }
  const isLoading = loading
  const rows = k.log ?? []

  const cards = [
    ['queue', k.queue], ['reports', k.reports], ['claims', k.claims],
    ['places', k.places.toLocaleString('de-DE')], ['users', k.users.toLocaleString('de-DE')], ['videos', k.videos.toLocaleString('de-DE')],
  ]

  return (
    <AdminShell title={t('admin.overview.title')}>
      <h1 className="t-h1" style={{ marginBottom: 'var(--sp-4)' }}>{t('admin.overview.title')}</h1>

      <div className="kpi-grid-6" style={{ marginBottom: 'var(--sp-8)' }}>
        {cards.map(([key, value]) => (
          isLoading
            ? <div className="card" key={key}><Skeleton w="60%" h={10} /><Skeleton w="40%" h={28} style={{ marginTop: 6 }} /></div>
            : <Kpi key={key} label={t(`admin.overview.kpi.${key}`)} value={value} />
        ))}
      </div>

      <h2 className="t-h2" style={{ marginBottom: 'var(--sp-3)' }}>{t('admin.overview.recent')}</h2>
      <AdminTable
        columns={[t('admin.overview.colTime'), t('admin.overview.colEvent'), t('admin.overview.colActor')]}
        rows={rows}
        empty={<p className="t-small c-secondary">{t('admin.reports.emptyTitle')}</p>}
        renderRow={(e) => (
          <tr key={e.id}>
            <td style={{ whiteSpace: 'nowrap' }}>{e.at.replace('T', ' ').slice(0, 16)}</td>
            <td>{e.action} · {e.object}</td>
            <td className="c-secondary">{e.admin}</td>
          </tr>
        )}
      />
    </AdminShell>
  )
}
