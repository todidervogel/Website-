import { useEffect, useState } from 'react'
import { Play, Video } from 'lucide-react'
import {
  Badge, Button, Card, EmptyState, Field, Select, Skeleton, Textarea, Thumb, useToast,
} from '../../design/ui'
import { AdminShell } from './AdminShell'
import { api, useQuery } from '../../lib/store'
import { t } from '../../design/i18n'

const REASONS = ['spam', 'hate', 'sexual', 'violence', 'copyright', 'wrongPlace', 'quality', 'other']

/** „vor 2 Std.", aus dem Anlagedatum gerechnet. */
function since(date) {
  const then = new Date(date).getTime()
  if (Number.isNaN(then)) return ''
  const hours = Math.max(Math.round((Date.now() - then) / 3600000), 0)
  if (hours < 24) return t('admin.videos.since', { time: `${hours} Std.` })
  return t('admin.videos.since', { time: `${Math.round(hours / 24)} Tagen` })
}

/** G.3, Admin Video-Freigabe */
export default function AdminVideos() {
  const [selected, setSelected] = useState(null)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('spam')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  const { data, loading } = useQuery(() => api.videos.pending(), [], { initial: [] })
  const queue = data ?? []
  const video = queue.find((v) => v.id === selected) ?? queue[0]

  /* Rutscht das gewählte Video aus der Warteschlange, springt die Auswahl nach. */
  useEffect(() => {
    if (video && selected !== video.id) setSelected(video.id)
  }, [video?.id])

  const approve = async () => {
    setBusy(true)
    await api.videos.moderate(video.id, 'published')
    setBusy(false)
    setSelected(null)
    toast(t('admin.videos.approve'))
  }

  const reject = async () => {
    setBusy(true)
    await api.videos.moderate(video.id, 'rejected', t(`admin.videos.reasons.${reason}`))
    setBusy(false)
    setRejecting(false)
    setMessage('')
    setSelected(null)
    toast(t('admin.videos.reject'))
  }

  /* Tastenkürzel wie angekündigt: F freigeben, A ablehnen, ↓ nächstes. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.matches('input, textarea, select')) return
      if (!video) return
      if (e.key.toLowerCase() === 'f') approve()
      if (e.key.toLowerCase() === 'a') setRejecting(true)
      if (e.key === 'ArrowDown') {
        const index = queue.findIndex((v) => v.id === video.id)
        setSelected(queue[(index + 1) % queue.length]?.id ?? null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [video?.id, queue.length])

  return (
    <AdminShell title={t('admin.videos.title')}>
      <h1 className="t-h1" style={{ marginBottom: 'var(--sp-4)' }}>{t('admin.videos.title')}</h1>

      {loading ? (
        <div className="admin-split">
          <div className="stack-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} h={64} radius="var(--r-card)" />)}</div>
          <Skeleton h={360} radius="var(--r-card)" />
        </div>
      ) : queue.length === 0 || !video ? (
        <EmptyState icon={Video} title={t('admin.videos.emptyTitle')} text={t('admin.videos.emptyText')} />
      ) : (
        <div className="admin-split">
          <div className="list-group">
            {queue.map((v) => (
              <button
                key={v.id}
                type="button"
                className="list-row"
                onClick={() => { setSelected(v.id); setRejecting(false) }}
                style={v.id === video.id ? { background: 'var(--bg-light-alt)' } : undefined}
              >
                <Thumb width={40} height={56} icon={Play} />
                <span className="grow">
                  <span className="t-small" style={{ fontWeight: 600, display: 'block' }}>{v.place?.name}</span>
                  <span className="t-small c-secondary">@{v.author?.username} · {since(v.createdAt)}</span>
                </span>
                {v.authorType === 'gastro' && <Badge tone="verified">{t('dev.roles.gastro')}</Badge>}
              </button>
            ))}
          </div>

          <div className="stack-4">
            <div
              style={{
                background: '#000', borderRadius: 'var(--r-card)', display: 'grid', placeItems: 'center',
                aspectRatio: '9 / 16', maxHeight: 420, width: '100%', maxWidth: 260,
              }}
            >
              <Play size={36} color="#fff" fill="#fff" strokeWidth={0} />
            </div>

            <Card>
              <table className="table" style={{ margin: 0 }}>
                <tbody>
                  <tr><td className="c-secondary" style={{ width: 160 }}>{t('admin.videos.author')}</td><td>@{video.author?.username}</td></tr>
                  <tr><td className="c-secondary">{t('admin.videos.place')}</td><td>{video.place?.name}</td></tr>
                  <tr><td className="c-secondary">{t('admin.videos.duration')}</td><td>{video.durationSec} Sek.</td></tr>
                  <tr>
                    <td className="c-secondary">{t('admin.videos.rating')}</td>
                    <td>
                      {video.review
                        ? `★ ${video.review.ratingFood ?? '–'} / ${video.review.ratingService ?? '–'} / ${video.review.ratingPrice ?? '–'}`
                        : t('rating.none')}
                    </td>
                  </tr>
                  <tr><td className="c-secondary">{t('admin.videos.caption')}</td><td>{video.caption}</td></tr>
                  <tr>
                    <td className="c-secondary">{t('admin.videos.gps')}</td>
                    <td>{video.verifiedOnSite ? t('common.yes') : t('common.no')}</td>
                  </tr>
                </tbody>
              </table>
            </Card>

            <div className="row-wrap">
              <Button variant="primary" style={{ background: 'var(--success)' }} loading={busy} onClick={approve}>
                {t('admin.videos.approve')}
              </Button>
              <Button variant="danger" onClick={() => setRejecting((r) => !r)}>{t('admin.videos.reject')}</Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const index = queue.findIndex((v) => v.id === video.id)
                  setSelected(queue[(index + 1) % queue.length]?.id ?? null)
                }}
              >
                {t('admin.videos.postpone')}
              </Button>
            </div>

            {rejecting && (
              <Card className="stack-3">
                <Field label={t('admin.videos.reasonLabel')} required>
                  {(id) => (
                    <Select
                      id={id}
                      options={REASONS.map((r) => ({ value: r, label: t(`admin.videos.reasons.${r}`) }))}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  )}
                </Field>
                <Field label={t('admin.videos.messageLabel')}>
                  {(id) => <Textarea id={id} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />}
                </Field>
                <div className="row" style={{ justifyContent: 'flex-end' }}>
                  <Button variant="secondary" size="sm" onClick={() => setRejecting(false)}>{t('common.cancel')}</Button>
                  <Button variant="danger" size="sm" loading={busy} onClick={reject}>{t('admin.videos.reject')}</Button>
                </div>
              </Card>
            )}

            <p className="t-small c-tertiary">{t('admin.videos.shortcuts')}</p>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
