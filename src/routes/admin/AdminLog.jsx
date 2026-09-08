import { useState } from 'react'
import { FileClock } from 'lucide-react'
import { EmptyState, Input, Select } from '../../design/ui'
import { AdminShell, AdminTable } from './AdminShell'
import { api, useQuery } from '../../lib/store'
import { t } from '../../design/i18n'

/** G.9, Admin-Protokoll (nur lesbar) */
export default function AdminLog() {
  const [who, setWho] = useState('')
  const [day, setDay] = useState('')

  const { data } = useQuery(() => api.admin.auditLog(), [], { initial: [] })
  const rows = (data ?? [])
    .filter((l) => !who || l.admin === who)
    .filter((l) => !day || l.at.startsWith(day))
  const admins = [...new Set((data ?? []).map((l) => l.admin))]

  return (
    <AdminShell title={t('admin.log.title')}>
      <h1 className="t-h1" style={{ marginBottom: 'var(--sp-4)' }}>{t('admin.log.title')}</h1>

      <div className="row-wrap" style={{ marginBottom: 'var(--sp-4)' }}>
        <Select
          style={{ width: 'auto', minHeight: 36 }}
          placeholder={t('admin.log.filterAdmin')}
          options={[{ value: '', label: t('common.all') }, ...admins.map((a) => ({ value: a, label: a }))]}
          aria-label={t('admin.log.filterAdmin')}
          value={who}
          onChange={(e) => setWho(e.target.value)}
        />
        <Input
          type="date" style={{ width: 'auto', minHeight: 36 }}
          aria-label={t('admin.log.filterRange')}
          value={day}
          onChange={(e) => setDay(e.target.value)}
        />
      </div>

      <AdminTable
        columns={[
          t('admin.log.cols.time'), t('admin.log.cols.admin'), t('admin.log.cols.action'),
          t('admin.log.cols.object'), t('admin.log.cols.note'),
        ]}
        rows={rows}
        empty={<EmptyState icon={FileClock} title={t('admin.reports.emptyTitle')} />}
        renderRow={(l) => (
          <tr key={l.id}>
            <td style={{ whiteSpace: 'nowrap' }}>{l.at.replace('T', ' ').slice(0, 16)}</td>
            <td>{l.admin}</td>
            <td>{l.action}</td>
            <td className="c-secondary">{l.object}</td>
            <td className="c-secondary">{l.note || '–'}</td>
          </tr>
        )}
      />
    </AdminShell>
  )
}
