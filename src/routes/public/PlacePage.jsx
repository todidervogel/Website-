import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  Bookmark, Camera, ChevronDown, ChevronLeft, ChevronRight, Globe, Image as ImageIcon, Info,
  MapPin, Phone, Share2, Navigation, UtensilsCrossed, ClipboardList, AlertTriangle,
} from 'lucide-react'
import {
  Badge, Button, Chip, EmptyState, IconButton, LoadingBlock, Menu, Notice, RatingFull,
  ReviewCard, ReviewCardSkeleton, ServingRow, Skeleton, SkeletonTile, Spinner, Stars, Tabs,
  Thumb, VerifiedMark, VideoTile, useToast,
} from '../../design/ui'
import { BarePage } from '../../components/layout'
import { ReportPlaceDialog } from '../dialogs/ReportPlaceDialog'
import { ReportContentDialog } from '../dialogs/ReportContentDialog'
import { useDesignState, useVariant } from '../../lib/design-state'
import { useRequireLogin } from '../../lib/auth'
import { useSession } from '../../lib/session'
import { api, dayKeyOf, useQuery } from '../../lib/store'
import { openSentence, weekRowsText } from '../../lib/hours-text'
import { MVP_STAGE } from '../../design/config'
import { t } from '../../design/i18n'

const TABS = [
  { id: 'videos', label: t('place.tabs.videos') },
  { id: 'menu', label: t('place.menuTab') },
  { id: 'reviews', label: t('place.tabs.reviews') },
  { id: 'info', label: t('place.tabs.info') },
]

/** C.3 — Gastro-Seite /g/[slug] · D.6 — Einstieg über QR-Code */
export default function PlacePage() {
  const { slug } = useParams()
  const [params] = useSearchParams()
  const { position } = useDesignState()
  const { userId, loggedIn } = useSession()
  const [tab, setTab] = useState('videos')
  const [hoursOpen, setHoursOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const toast = useToast()
  const requireLogin = useRequireLogin()
  const fromQr = params.get('src') === 'qr'

  const { data: place, loading } = useVariant(
    useQuery(() => api.places.bySlug(slug, position), [slug, position]),
  )

  const saved = !!place?.viewerSaved
  const toggleSave = requireLogin(async () => {
    const now = await api.social.toggleSave(null, 'place', place.id)
    toast(now ? t('toast.saved') : t('common.removed'))
  })

  if (loading) {
    return (
      <BarePage title={t('common.loading')}>
        <div className="cover"><Skeleton w="100%" h="100%" radius={0} /></div>
        <div className="container stack-3" style={{ paddingTop: 'var(--sp-4)' }}>
          <Skeleton w="55%" h={26} />
          <Skeleton w="40%" h={14} />
          <Skeleton w={280} h={16} />
          <LoadingBlock minHeight={120} />
        </div>
      </BarePage>
    )
  }

  if (!place) {
    return (
      <BarePage title={t('place.notFoundTitle')}>
        <div className="container" style={{ paddingBlock: 'var(--sp-16)' }}>
          <EmptyState
            icon={UtensilsCrossed}
            title={t('place.notFoundTitle')}
            text={t('place.notFoundText')}
            action={<Button variant="primary" to="/karte">{t('map.title')}</Button>}
          />
        </div>
      </BarePage>
    )
  }

  return (
    <BarePage title={place.name}>
      {/* D.6 — Band beim Einstieg über den QR-Code im Lokal */}
      {fromQr && (
        <div className="build-banner" style={{ paddingRight: 'var(--sp-4)' }}>
          <span>
            📍 {t('place.qrBanner', { name: place.name })}{' '}
            <Link to="/registrieren" className="c-accent" style={{ fontWeight: 600 }}>{t('place.qrCta')}</Link>
          </span>
        </div>
      )}

      <div className="cover">
        {place.hasCover ? <ImageIcon size={32} /> : <UtensilsCrossed size={40} />}
        <span className="cover-back only-mobile">
          <IconButton icon={ChevronLeft} label={t('common.back')} tone="glass" to="/karte" />
        </span>
        <span className="cover-actions">
          <IconButton icon={Share2} label={t('common.share')} tone="glass" onClick={() => toast(t('toast.linkCopied'))} />
          <IconButton
            icon={Bookmark}
            label={t('place.save')}
            tone="glass"
            className={saved ? 'is-active' : ''}
            onClick={toggleSave}
          />
        </span>
      </div>

      <div className="container">
        <section style={{ paddingTop: 'var(--sp-4)' }} className="stack-3">
          <div className="row-wrap" style={{ gap: 'var(--sp-2)' }}>
            <h1 className="t-h1">{place.name}</h1>
            {place.verified && <VerifiedMark withLabel />}
          </div>

          {place.status === 'closed_reported' && (
            <Notice tone="danger" icon={AlertTriangle}>{t('place.closedReported')}</Notice>
          )}
          {place.status === 'closing' && (
            <Notice tone="danger" icon={AlertTriangle}>{t('place.closingNotice')}</Notice>
          )}

          {!place.verified && (
            <Notice icon={Info}>
              {t('place.unverifiedNotice')}{' '}
              <Link to="/gastro/eintragen" className="c-accent">{t('place.unverifiedLink')}</Link>
            </Notice>
          )}

          {/* Angebot steht ganz oben: was gibt es hier überhaupt? */}
          <ServingRow serving={place.serving} size="md" />

          <p className="t-body c-secondary">{place.tags.join(' · ')} · {place.price}</p>

          <RatingFull rating={place.rating} count={place.reviewCount || undefined} />

          <div>
            <button
              type="button"
              className="row"
              style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', gap: 4 }}
              aria-expanded={hoursOpen}
              onClick={() => setHoursOpen((o) => !o)}
            >
              <span className="t-body" style={{ color: place.open ? 'var(--success)' : 'var(--text-secondary)', fontWeight: 600 }}>
                {openSentence(place)}
              </span>
              <ChevronDown size={16} style={{ transform: hoursOpen ? 'rotate(180deg)' : 'none' }} />
            </button>
            {hoursOpen && <HoursTable hours={place.hours} />}
          </div>

          <div className="row" style={{ alignItems: 'flex-start' }}>
            <MapPin size={18} className="c-secondary" style={{ flex: 'none', marginTop: 2 }} />
            <span className="t-body">{place.address}, {place.zip} {place.city}</span>
          </div>
          <div className="mini-map"><MapPin size={22} /></div>

          {place.phone && (
            <a className="row" href={`tel:${place.phone}`} style={{ textDecoration: 'none' }}>
              <Phone size={18} className="c-secondary" />
              <span className="t-body">{place.phone}</span>
            </a>
          )}
          {place.website && (
            <a className="row" href={`https://${place.website}`} style={{ textDecoration: 'none' }}>
              <Globe size={18} className="c-secondary" />
              <span className="t-body c-accent">{place.website}</span>
            </a>
          )}
        </section>

        <div className="action-bar">
          {MVP_STAGE >= 2 && <Button variant="primary" onClick={() => toast(t('toast.noAction'), 'info')}>{t('place.order')}</Button>}
          <Button variant="secondary" icon={UtensilsCrossed} to={`/g/${place.slug}/speisekarte`}>{t('menu.title')}</Button>
          <Button variant="secondary" icon={Navigation} onClick={() => toast(t('toast.noAction'), 'info')}>{t('place.route')}</Button>
          <Button variant="secondary" icon={Phone} href={place.phone ? `tel:${place.phone}` : undefined}>{t('place.call')}</Button>
          <Button variant="secondary" icon={Bookmark} onClick={toggleSave}>{t('place.save')}</Button>
          <Button variant="secondary" icon={Share2} onClick={() => toast(t('toast.linkCopied'))}>{t('common.share')}</Button>
        </div>

        <Tabs items={TABS} value={tab} onChange={setTab} />

        <div style={{ paddingBlock: 'var(--sp-6) var(--sp-16)' }}>
          {tab === 'videos' && <VideosTab place={place} />}
          {tab === 'menu' && <MenuTab place={place} />}
          {tab === 'reviews' && <ReviewsTab place={place} />}
          {tab === 'info' && <InfoTab place={place} onReport={() => setReportOpen(true)} />}
        </div>
      </div>

      <ReportPlaceDialog open={reportOpen} onClose={() => setReportOpen(false)} place={place} />
    </BarePage>
  )
}

function HoursTable({ hours }) {
  const today = dayKeyOf(new Date())
  return (
    <table className="hours-table" style={{ marginTop: 'var(--sp-2)', maxWidth: 280 }}>
      <tbody>
        {weekRowsText(hours).map(([day, time]) => (
          <tr key={day} className={day === today ? 'is-today' : undefined}>
            <td style={{ width: 110 }}>{t(`hours.days.${day}`)}</td>
            <td className={time === t('hours.closed') ? 'c-secondary' : undefined}>{time}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* --- Reiter „Videos“ ----------------------------------------------------- */
function VideosTab({ place }) {
  const { data, loading } = useVariant(
    useQuery(() => api.videos.byPlace(place.id), [place.id], { initial: [] }),
  )
  const list = data ?? []

  if (loading) {
    return (
      <div className="video-grid">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonTile key={i} />)}
      </div>
    )
  }
  if (list.length === 0) {
    return (
      <EmptyState
        icon={Camera}
        title={t('place.videosEmptyTitle')}
        text={t('place.videosEmptyText')}
        action={<Button variant="primary" to="/upload">{t('place.videosEmptyCta')}</Button>}
      />
    )
  }
  return (
    <div className="video-grid">
      {list.map((v) => (
        <VideoTile key={v.id} to={`/v/${v.id}`} views={v.views.toLocaleString('de-DE')} author={v.author?.username} />
      ))}
    </div>
  )
}

/* --- Reiter „Speisekarte“ ------------------------------------------------ */
function MenuTab({ place }) {
  const { data, loading } = useVariant(
    useQuery(() => api.menu.get(place.id), [place.id], { initial: [] }),
  )
  const categories = data ?? []
  const total = categories.reduce((sum, c) => sum + c.items.length, 0)

  if (loading) {
    return (
      <div className="stack-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="row" key={i}>
            <Skeleton w={64} h={64} radius="var(--r-card)" />
            <div className="grow stack-2"><Skeleton w="40%" h={14} /><Skeleton w="80%" h={12} /></div>
          </div>
        ))}
      </div>
    )
  }

  if (total === 0) {
    return <EmptyState icon={ClipboardList} title={t('place.dishesEmptyTitle')} text={t('place.dishesEmptyText')} />
  }

  return (
    <div className="stack-6">
      <div className="row-between">
        <span className="t-small c-secondary">{t('place.menuCount', { count: total })}</span>
        <Link to={`/g/${place.slug}/speisekarte`} className="btn btn-secondary btn-sm">
          {t('place.fullMenu')} <ChevronRight size={16} />
        </Link>
      </div>

      {/* Auf der Gastro-Seite steht eine Vorschau; die ganze Karte hat eine eigene Seite. */}
      {categories.filter((c) => c.items.length > 0).map((category) => (
        <section key={category.id}>
          <h3 className="t-h3" style={{ marginBottom: 'var(--sp-3)' }}>{category.name}</h3>
          <div className="stack-4">
            {category.items.slice(0, 3).map((d) => <DishPreview key={d.id} dish={d} />)}
          </div>
          {category.items.length > 3 && (
            <Link to={`/g/${place.slug}/speisekarte`} className="btn btn-quiet btn-sm" style={{ marginTop: 'var(--sp-2)' }}>
              +{category.items.length - 3} {t('common.more')}
            </Link>
          )}
        </section>
      ))}

      <Button variant="secondary" full to={`/g/${place.slug}/speisekarte`}>{t('menu.open')}</Button>
    </div>
  )
}

function DishPreview({ dish }) {
  return (
    <div className="row" style={{ alignItems: 'flex-start', paddingBottom: 'var(--sp-4)', borderBottom: '1px solid var(--border)' }}>
      <Thumb size={64} icon={UtensilsCrossed} />
      <div className="grow">
        <div className="row" style={{ gap: 4 }}>
          <span className="t-h3">{dish.name}</span>
          {dish.confirmed && <VerifiedMark />}
        </div>
        <p className="t-small c-secondary clamp-2">{dish.description}</p>
        <div className="row-wrap" style={{ gap: 4, marginTop: 4 }}>
          {(dish.diet ?? []).map((k) => <Badge key={k} tone="success">{t(`diet.${k}`)}</Badge>)}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p className="t-body-bold">{(dish.priceCents / 100).toFixed(2).replace('.', ',')} €</p>
        {dish.ratingCount > 0 ? (
          <p className="t-small c-secondary row" style={{ gap: 4, justifyContent: 'flex-end' }}>
            <Stars value={dish.rating} size={12} /> {dish.rating.toFixed(1).replace('.', ',')} ({dish.ratingCount})
          </p>
        ) : (
          <p className="t-small c-tertiary">{t('menu.noRating')}</p>
        )}
      </div>
    </div>
  )
}

/* --- Reiter „Bewertungen“ ------------------------------------------------ */
function ReviewsTab({ place }) {
  const requireLogin = useRequireLogin()
  const [filter, setFilter] = useState('all')
  const [reportTarget, setReportTarget] = useState(null)
  const { data, loading } = useVariant(
    useQuery(() => api.reviews.byPlace(place.id, { filter }), [place.id, filter], { initial: [] }),
  )
  const list = data ?? []

  return (
    <div className="stack-4">
      <div className="row-between" style={{ flexWrap: 'wrap' }}>
        <div className="row-wrap">
          {['all', 'withVideo', 'verified'].map((k) => (
            <Chip key={k} active={filter === k} onClick={() => setFilter(k)}>{t(`place.reviewFilters.${k}`)}</Chip>
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
        <>{Array.from({ length: 3 }).map((_, i) => <ReviewCardSkeleton key={i} />)}</>
      ) : list.length === 0 ? (
        <EmptyState icon={ClipboardList} title={t('place.reviewsEmptyTitle')} text={t('place.reviewsEmptyText')} />
      ) : (
        list.map((r) => (
          <ReviewCard
            key={r.id}
            review={r}
            onLike={requireLogin(() => api.reviews.like(r.id))}
            onReport={() => setReportTarget({ type: 'review', id: r.id, label: `${r.id} · ${place.name}` })}
          />
        ))
      )}

      <ReportContentDialog open={!!reportTarget} onClose={() => setReportTarget(null)} target={reportTarget} />
    </div>
  )
}

/* --- Reiter „Infos“ ------------------------------------------------------ */
function InfoTab({ place, onReport }) {
  return (
    <div className="stack-6">
      <p className="t-body">{place.description}</p>

      <div>
        <h3 className="t-h3" style={{ marginBottom: 'var(--sp-3)' }}>{t('place.servingTitle')}</h3>
        <ServingRow serving={place.serving} size="md" />
      </div>

      <div>
        <h3 className="t-h3" style={{ marginBottom: 'var(--sp-3)' }}>{t('place.features')}</h3>
        <div className="row-wrap">
          {place.features.map((f) => <Chip key={f}>{t(`features.${f}`)}</Chip>)}
        </div>
      </div>

      <div>
        <h3 className="t-h3" style={{ marginBottom: 'var(--sp-2)' }}>{t('gastro.profile.sectionHours')}</h3>
        <HoursTable hours={place.hours} />
      </div>

      <div>
        <h3 className="t-h3" style={{ marginBottom: 'var(--sp-2)' }}>{t('place.address')}</h3>
        <p className="t-body c-secondary" style={{ marginBottom: 'var(--sp-3)' }}>
          {place.address}, {place.zip} {place.city}
        </p>
        <div className="mini-map mini-map-lg"><MapPin size={26} /></div>
      </div>

      <div>
        <Button variant="quiet" onClick={onReport}>{t('place.reportProblem')}</Button>
      </div>
    </div>
  )
}
