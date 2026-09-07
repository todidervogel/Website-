import { Plus, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Button, Card, EmptyState, Notice, ReviewCard, Skeleton, Stars, VideoTile,
} from '../../design/ui'
import { Kpi } from '../../components/layout'
import { GastroShell, useMyPlace } from './GastroShell'
import { api, useQuery } from '../../lib/store'
import { t } from '../../design/i18n'

/** F.4 — Gastro-Dashboard, Bereich „Übersicht“ */
export default function GastroDashboard() {
  return (
    <GastroShell title={t('gastro.nav.overview')}>
      <DashboardBody />
    </GastroShell>
  )
}

function DashboardBody() {
  const place = useMyPlace()
  const { data: stats, loading } = 
    useQuery(() => api.gastro.dashboard(place.id), [place.id])
  const { data: videos } = useQuery(
    () => api.videos.byPlace(place.id, { includeAll: true }), [place.id], { initial: [] },
  )
  const { data: menu } = useQuery(() => api.menu.get(place.id), [place.id], { initial: [] })

  /* Die Aufgabenliste beantwortet sich aus den Daten selbst. */
  const tasks = [
    ['profile', !!place.description],
    ['cover', !!place.hasCover],
    ['menu', (menu ?? []).some((c) => c.items.length > 0)],
    ['video', (videos ?? []).length > 0],
    ['qr', false],
  ]

  return (
    <div className="stack-8">
      <div className="stack-3">
        <h1 className="t-h1">{place.name}</h1>
        {!place.verified && (
          <Notice>
            {t('gastro.dashboard.unverified')}{' '}
            <Link to="/gastro/einstellungen" className="c-accent">{t('gastro.dashboard.verifyNow')}</Link>
          </Notice>
        )}
      </div>

      {loading ? (
        <div className="kpi-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><Skeleton w="50%" h={12} /><Skeleton w="70%" h={32} style={{ marginTop: 8 }} /></Card>
          ))}
        </div>
      ) : !stats ? (
        <EmptyState icon={Star} title={t('gastro.dashboard.emptyTitle')} text={t('gastro.dashboard.emptyText')} />
      ) : (
        <>
          <div className="kpi-grid">
            <Kpi
              label={t('gastro.dashboard.kpiViews')}
              value={stats.views.toLocaleString('de-DE')}
              sub={t('gastro.dashboard.kpiViewsSub')}
            />
            <Kpi
              label={t('gastro.dashboard.kpiReviews')}
              value={String(stats.reviewCount)}
              sub={`${stats.reviewsNew} ${t('gastro.dashboard.kpiReviewsSub')}`}
            />
            <Kpi
              label={t('gastro.dashboard.kpiFood')}
              value={stats.rating?.food ? stats.rating.food.toFixed(1).replace('.', ',') : '—'}
            >
              {stats.rating?.food && <Stars value={stats.rating.food} size={16} />}
            </Kpi>
            <Kpi
              label={t('gastro.dashboard.kpiProfile')}
              value={String(stats.videoCount)}
              sub={stats.pending > 0 ? t('gastro.videos.statusPending') : ''}
            />
          </div>

          <section>
            <h2 className="t-h2" style={{ marginBottom: 'var(--sp-4)' }}>{t('gastro.dashboard.latestReviews')}</h2>
            {stats.latest.length === 0 ? (
              <EmptyState icon={Star} title={t('place.reviewsEmptyTitle')} text={t('place.reviewsEmptyText')} />
            ) : (
              <div className="stack-3">
                {stats.latest.map((r) => (
                  <ReviewCard key={r.id} review={r} variant="gastro" onReply={(text) => api.reviews.answer(r.id, text)} />
                ))}
              </div>
            )}
            <Button variant="quiet" to="/gastro/bewertungen" style={{ marginTop: 'var(--sp-2)', marginLeft: -8 }}>
              {t('common.showAll')}
            </Button>
          </section>

          <section>
            <h2 className="t-h2" style={{ marginBottom: 'var(--sp-4)' }}>{t('gastro.dashboard.yourVideos')}</h2>
            <div className="video-rail">
              <Link
                to="/gastro/videos"
                className="dropzone"
                style={{ width: 180, flex: 'none', aspectRatio: '9 / 16', textDecoration: 'none' }}
              >
                <Plus size={24} />
                <span className="t-small">{t('gastro.dashboard.uploadVideo')}</span>
              </Link>
              {(videos ?? []).slice(0, 4).map((v) => (
                <VideoTile
                  key={v.id}
                  to={`/v/${v.id}`}
                  views={v.views.toLocaleString('de-DE')}
                  width={180}
                  pending={v.status === 'pending_review'}
                />
              ))}
            </div>
          </section>
        </>
      )}

      <section>
        <h2 className="t-h2" style={{ marginBottom: 'var(--sp-3)' }}>{t('gastro.dashboard.tasks')}</h2>
        <div className="list-group">
          {tasks.map(([key, done]) => (
            <div className="list-row list-row-static" key={key}>
              <input
                type="checkbox"
                checked={done}
                readOnly
                style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
              />
              <span
                className={`grow t-body ${done ? 'c-secondary' : ''}`}
                style={done ? { textDecoration: 'line-through' } : undefined}
              >
                {t(`gastro.dashboard.taskList.${key}`)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
