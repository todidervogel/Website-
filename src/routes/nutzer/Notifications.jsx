import { Bell, CheckCircle2, Heart, MessageSquare, UserPlus, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar, Button, EmptyState, Skeleton } from '../../design/ui'
import { Page } from '../../components/layout'
import { useSession } from '../../lib/session'
import { api, useQuery } from '../../lib/store'
import { t } from '../../design/i18n'

const ICONS = { follow: UserPlus, like: Heart, reply: MessageSquare, approved: CheckCircle2, rejected: XCircle }

/** „vor 2 Std.“, „gestern“, „vor 4 Tagen“ — aus einem Zeitstempel gerechnet. */
function ago(iso) {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const minutes = Math.max(Math.round((Date.now() - then) / 60000), 0)
  if (minutes < 60) return `vor ${minutes} Min.`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `vor ${hours} Std.`
  const days = Math.round(hours / 24)
  return days === 1 ? 'gestern' : `vor ${days} Tagen`
}

/** E.13 — Benachrichtigungen */
export default function Notifications() {
  const { userId } = useSession()
  const { data, loading } = 
    useQuery(() => api.notifications.list(), [userId], { initial: [] })
  const list = data ?? []
  const unread = list.filter((n) => n.unread).length

  return (
    <Page title={t('notifications.title')} footer={false}>
      <div style={{ paddingBlock: 'var(--sp-6) var(--sp-16)', maxWidth: 640 }}>
        <div className="row-between" style={{ marginBottom: 'var(--sp-4)' }}>
          <h1 className="t-h1">{t('notifications.title')}</h1>
          <Button
            variant="quiet"
            size="sm"
            disabled={unread === 0}
            onClick={() => api.notifications.markAllRead()}
          >
            {t('notifications.markAllRead')}
          </Button>
        </div>

        {loading ? (
          <div className="list-group">
            {Array.from({ length: 5 }).map((_, i) => (
              <div className="list-row list-row-static" key={i}>
                <Skeleton w={40} h={40} radius="50%" />
                <div className="grow"><Skeleton w="70%" h={12} /></div>
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState icon={Bell} title={t('notifications.emptyTitle')} text={t('notifications.emptyText')} />
        ) : (
          <div className="list-group">
            {list.map((n) => {
              const Icon = ICONS[n.type] ?? Bell
              return (
                <div
                  className="list-row list-row-static"
                  key={n.id}
                  style={n.unread ? { background: 'var(--accent-soft)' } : undefined}
                >
                  {n.actor ? <Avatar name={n.actor} size={40} /> : (
                    <span className="thumb-placeholder" style={{ width: 40, height: 40, borderRadius: '50%' }}>
                      <Icon size={18} />
                    </span>
                  )}
                  <span className="grow t-body">
                    {n.actor && <strong>{n.actor.includes(' ') ? n.actor : `@${n.actor}`} </strong>}
                    {n.text}
                    {n.link === 'why' && <> <Link to="/richtlinien" className="c-accent">{t('notifications.why')}</Link></>}
                  </span>
                  <span className="t-small c-tertiary" style={{ flex: 'none' }}>{ago(n.createdAt)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Page>
  )
}
