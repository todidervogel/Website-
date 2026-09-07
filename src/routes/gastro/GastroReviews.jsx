import { useState } from 'react'
import { ChevronDown, Star } from 'lucide-react'
import {
  Card, Chip, EmptyState, Menu, ReviewCard, ReviewCardSkeleton, Stars,
} from '../../design/ui'
import { GastroShell, useMyPlace } from './GastroShell'
import { ConsoleHeader } from '../../components/layout'
import { ReportReviewDialog } from '../dialogs/GastroDialogs'
import { api, useQuery } from '../../lib/store'
import { t } from '../../design/i18n'

const FILTERS = ['all', 'unanswered', 'withVideo', 'lowStars']

/** F.7 — Gastro-Bewertungen */
export default function GastroReviews() {
  return (
    <GastroShell title={t('gastro.reviews.title')}>
      <ReviewsBody />
    </GastroShell>
  )
}

function ReviewsBody() {
  const place = useMyPlace()
  const [filter, setFilter] = useState('all')
  const [reportTarget, setReportTarget] = useState(null)

  const { data, loading } = 
    useQuery(() => api.reviews.byPlace(place.id), [place.id], { initial: [] })
  const all = data ?? []

  const list = all.filter((r) => {
    if (filter === 'unanswered') return !r.answer
    if (filter === 'withVideo') return !!r.videoId
    if (filter === 'lowStars') return (r.ratingFood ?? 5) <= 2
    return true
  })

  /* Die Verteilung ergibt sich aus den Bewertungen selbst. */
  const distribution = [5, 4, 3, 2, 1].map((stars) => [
    stars, all.filter((r) => Math.round(r.ratingFood ?? 0) === stars).length,
  ])
  const total = Math.max(distribution.reduce((sum, [, n]) => sum + n, 0), 1)

  return (
    <>
      <ConsoleHeader title={t('gastro.reviews.title')} />

      {all.length > 0 && (
        <Card style={{ marginBottom: 'var(--sp-6)' }}>
          <div style={{ display: 'grid', gap: 'var(--sp-6)', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            {[
              [t('rating.food'), place.rating?.food],
              [t('rating.service'), place.rating?.service],
              [t('rating.price'), place.rating?.price],
            ].filter(([, value]) => value != null).map(([label, value]) => (
              <div key={label}>
                <p className="t-small c-secondary">{label}</p>
                <p className="kpi-value">{value.toFixed(1).replace('.', ',')}</p>
                <Stars value={value} size={16} />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'var(--sp-6)', display: 'grid', gap: 6, maxWidth: 420 }}>
            <p className="t-small c-secondary">{t('gastro.reviews.distribution')}</p>
            {distribution.map(([stars, count]) => (
              <div className="row" key={stars} style={{ gap: 'var(--sp-2)' }}>
                <span className="t-small" style={{ width: 30 }}>{stars} <Star size={11} className="star-filled" strokeWidth={0} /></span>
                <span style={{ flex: 1, height: 8, borderRadius: 'var(--r-pill)', background: 'var(--bg-light-alt)' }}>
                  <span style={{ display: 'block', width: `${(count / total) * 100}%`, height: '100%', borderRadius: 'var(--r-pill)', background: 'var(--star-filled)' }} />
                </span>
                <span className="t-small c-secondary" style={{ width: 24, textAlign: 'right' }}>{count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="row-between" style={{ marginBottom: 'var(--sp-4)', flexWrap: 'wrap' }}>
        <div className="row-wrap">
          {FILTERS.map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{t(`gastro.reviews.filters.${f}`)}</Chip>
          ))}
        </div>
        <Menu
          align="right"
          trigger={({ toggle }) => (
            <button type="button" className="chip" onClick={toggle}>{t('common.sortNewest')} <ChevronDown size={14} /></button>
          )}
        >
          {({ close }) => (
            <>
              <button type="button" className="menu-item" onClick={close}>{t('common.sortNewest')}</button>
              <button type="button" className="menu-item" onClick={close}>{t('place.dishesSortOptions.best')}</button>
            </>
          )}
        </Menu>
      </div>

      {loading ? (
        <div className="stack-3">{Array.from({ length: 3 }).map((_, i) => <ReviewCardSkeleton key={i} />)}</div>
      ) : list.length === 0 ? (
        <EmptyState icon={Star} title={t('gastro.reviews.emptyTitle')} text={t('gastro.reviews.emptyText')} />
      ) : (
        <div className="stack-3">
          {list.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              variant="gastro"
              onReply={(text) => api.reviews.answer(r.id, text)}
              onReport={() => setReportTarget({ type: 'review', id: r.id, label: `${r.id} · ${place.name}` })}
            />
          ))}
        </div>
      )}

      <ReportReviewDialog open={!!reportTarget} onClose={() => setReportTarget(null)} target={reportTarget} />
    </>
  )
}
