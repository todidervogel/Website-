import {
  BarChart3, Building2, FileClock, Flag, Lightbulb, Mail, Users, Video,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ConsolePage } from '../../components/layout'
import { useSession } from '../../lib/session'
import { t } from '../../design/i18n'

const ITEMS = [
  { to: '/admin', label: t('admin.nav.overview'), icon: BarChart3 },
  { to: '/admin/videos', label: t('admin.nav.videos'), icon: Video },
  { to: '/admin/meldungen', label: t('admin.nav.reports'), icon: Flag },
  { to: '/admin/betriebe', label: t('admin.nav.places'), icon: Building2 },
  { to: '/admin/einladungen', label: t('admin.nav.invites'), icon: Mail },
  { to: '/admin/nutzer', label: t('admin.nav.users'), icon: Users },
  { to: '/admin/vorschlaege', label: t('admin.nav.suggestions'), icon: Lightbulb },
  { to: '/admin/protokoll', label: t('admin.nav.log'), icon: FileClock },
]

/**
 * G.1 — Admin-Rahmen.
 * Eigene, sehr nüchterne Optik: dichtere Tabellen, Small als Standardgröße,
 * keine Akzentflächen außer bei Aktionen.
 */
export function AdminShell({ title, children }) {
  const { user, logout } = useSession()
  const navigate = useNavigate()

  return (
    <ConsolePage
      admin
      title={title}
      items={ITEMS}
      base="/admin"
      footerSlot={
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--sp-3)', marginTop: 'var(--sp-3)' }}>
          <p className="t-small">{user?.email ?? '—'}</p>
          <button
            type="button"
            className="btn btn-quiet btn-sm"
            style={{ marginLeft: -8 }}
            onClick={() => { logout(); navigate('/anmelden', { replace: true }) }}
          >
            {t('admin.logout')}
          </button>
        </div>
      }
    >
      {children}
    </ConsolePage>
  )
}

/** Tabelle im Admin-Stil. */
export function AdminTable({ columns, rows, renderRow, empty }) {
  if (rows.length === 0 && empty) return empty
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>{rows.map(renderRow)}</tbody>
      </table>
    </div>
  )
}
