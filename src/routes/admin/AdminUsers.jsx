import { useState } from 'react'
import { Search, Users } from 'lucide-react'
import {
  Badge, Button, Checkbox, EmptyState, Field, Input, Modal, ModalActions, Select, useToast,
} from '../../design/ui'
import { AdminShell, AdminTable } from './AdminShell'
import { api, useQuery } from '../../lib/store'
import { t } from '../../design/i18n'

const TONE = { active: 'success', warned: 'warning', banned: 'danger' }
const DURATIONS = ['h24', 'd7', 'd30', 'forever']

/** G.7, Admin-Nutzer */
export default function AdminUsers() {
  const [banUser, setBanUser] = useState(null)
  const [query, setQuery] = useState('')
  const [duration, setDuration] = useState('d7')
  const [reason, setReason] = useState('')
  const toast = useToast()

  const { data } = useQuery(() => api.admin.users(), [], { initial: [] })
  const rows = (data ?? []).filter((u) => !query || `${u.username} ${u.email}`.toLowerCase().includes(query.toLowerCase()))

  const setStatus = async (user, status) => {
    await api.users.setStatus(user.id, status)
    setBanUser(null)
    setReason('')
    toast(t('common.saved'))
  }

  return (
    <AdminShell title={t('admin.users.title')}>
      <h1 className="t-h1" style={{ marginBottom: 'var(--sp-4)' }}>{t('admin.users.title')}</h1>

      <div className="header-search" style={{ maxWidth: 320, marginBottom: 'var(--sp-4)' }}>
        <Search size={16} className="search-icon" />
        <input
          className="input" style={{ height: 36, minHeight: 36 }}
          placeholder={t('common.search')} aria-label={t('common.search')}
          value={query} onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <AdminTable
        columns={[
          t('admin.users.cols.username'), t('admin.users.cols.email'), t('admin.users.cols.registered'),
          t('admin.users.cols.videos'), t('admin.users.cols.reviews'), t('admin.users.cols.reportsAgainst'),
          t('admin.users.cols.status'), '',
        ]}
        rows={rows}
        empty={<EmptyState icon={Users} title={t('admin.reports.emptyTitle')} />}
        renderRow={(u) => (
          <tr key={u.id}>
            <td style={{ fontWeight: 600 }}>@{u.username}</td>
            <td className="c-secondary">{u.email}</td>
            <td style={{ whiteSpace: 'nowrap' }}>{u.joined}</td>
            <td>{u.videoCount}</td>
            <td>{u.reviewCount}</td>
            <td className={u.reportCount > 2 ? 'c-danger' : undefined}>{u.reportCount}</td>
            <td><Badge tone={TONE[u.status]}>{t(`admin.users.status.${u.status}`)}</Badge></td>
            <td>
              <div className="row" style={{ gap: 0, flexWrap: 'nowrap' }}>
                <Button variant="quiet" size="sm" to={`/p/${u.username}`}>{t('admin.users.actions.view')}</Button>
                <Button variant="quiet" size="sm" onClick={() => setStatus(u, 'warned')}>{t('admin.users.actions.warn')}</Button>
                {u.status === 'banned' ? (
                  <Button variant="quiet" size="sm" onClick={() => setStatus(u, 'active')}>{t('admin.users.actions.unban')}</Button>
                ) : (
                  <Button variant="quiet" size="sm" onClick={() => setBanUser(u)}>{t('admin.users.actions.ban')}</Button>
                )}
              </div>
            </td>
          </tr>
        )}
      />

      <Modal
        open={banUser != null}
        onClose={() => setBanUser(null)}
        title={t('admin.users.banDialogTitle')}
        description={banUser ? `@${banUser.username}` : undefined}
        actions={
          <ModalActions onCancel={() => setBanUser(null)}>
            <Button variant="danger" disabled={!reason.trim()} onClick={() => setStatus(banUser, 'banned')}>
              {t('admin.users.actions.ban')}
            </Button>
          </ModalActions>
        }
      >
        <div className="stack-3">
          <Field label={t('admin.users.durationLabel')} required>
            {(id) => (
              <Select
                id={id}
                options={DURATIONS.map((d) => ({ value: d, label: t(`admin.users.durations.${d}`) }))}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            )}
          </Field>
          <Field label={t('admin.users.reasonLabel')} required>
            {(id) => <Input id={id} value={reason} onChange={(e) => setReason(e.target.value)} />}
          </Field>
          <Checkbox label={t('admin.users.notifyUser')} defaultChecked />
        </div>
      </Modal>
    </AdminShell>
  )
}
