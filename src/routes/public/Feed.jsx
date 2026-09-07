import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BadgeCheck, Bookmark, Camera, ChevronDown, ChevronRight, ChevronUp, Ellipsis, Heart, Lock,
  MessageCircle, Plus, Search, Share2, SlidersHorizontal, UtensilsCrossed,
} from 'lucide-react'
import {
  Avatar, Button, EmptyState, IconButton, Menu, MenuItem, MenuSeparator, OnSiteBadge,
  RatingCompact, ServingRow, Skeleton, Switch, useToast,
} from '../../design/ui'
import { FullscreenPage } from '../../components/layout'
import { ReportContentDialog } from '../dialogs/ReportContentDialog'
import { useDesignState, useVariant } from '../../lib/design-state'
import { useRequireLogin } from '../../lib/auth'
import { useSession } from '../../lib/session'
import { api, formatDistance, useQuery } from '../../lib/store'
import { RADIUS_OPTIONS, MVP_STAGE } from '../../design/config'
import { t } from '../../design/i18n'

/** C.6 — Video-Feed */
export default function Feed() {
  const { position, radiusKm, setRadiusKm } = useDesignState()
  const { userId, loggedIn } = useSession()
  const [onlyRated, setOnlyRated] = useState(false)
  const [index, setIndex] = useState(0)
  const [reportOpen, setReportOpen] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()
  const requireLogin = useRequireLogin()
  const wheelLock = useRef(0)
  const touchStart = useRef(null)

  const { data, loading } = useVariant(
    useQuery(() => api.videos.feed({ position, radiusKm, userId }), [position, radiusKm, userId], {
      initial: { items: [], widened: false },
    }),
  )

  const all = data?.items ?? []
  const items = onlyRated ? all.filter((v) => v.review) : all
  const video = items[Math.min(index, Math.max(items.length - 1, 0))]
  const commentsEnabled = MVP_STAGE >= 2

  /* Bei Filterwechsel wieder oben anfangen. */
  useEffect(() => { setIndex(0) }, [radiusKm, onlyRated])

  /*
   * Gesehenes merken — aber erst beim Weiterblättern, nicht beim Anzeigen.
   * Sonst rutscht das Video, das man gerade ansieht, bei der nächsten
   * Aktualisierung ans Ende der Liste und verschwindet unter den Fingern.
   */
  const seenRef = useRef(null)
  seenRef.current = video?.id ?? null
  useEffect(() => () => { if (seenRef.current) api.videos.markSeen(seenRef.current) }, [])

  const go = (delta) => {
    if (video) api.videos.markSeen(video.id)
    setIndex((i) => Math.min(Math.max(i + delta, 0), Math.max(items.length - 1, 0)))
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); go(1) }
      if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); go(-1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [items.length])

  const onWheel = (e) => {
    const now = Date.now()
    if (now - wheelLock.current < 500 || Math.abs(e.deltaY) < 12) return
    wheelLock.current = now
    go(e.deltaY > 0 ? 1 : -1)
  }

  const onTouchStart = (e) => { touchStart.current = e.touches[0].clientY }
  const onTouchEnd = (e) => {
    if (touchStart.current == null) return
    const delta = touchStart.current - e.changedTouches[0].clientY
    touchStart.current = null
    if (Math.abs(delta) > 60) go(delta > 0 ? 1 : -1)
  }

  /* Diese drei reisen an den Daten mit — sonst bräuchte jede Zeile eine eigene Nachfrage. */
  const liked = !!video?.viewerLiked
  const saved = !!video?.viewerSaved
  const following = video?.author?.viewerFollow && video.author.viewerFollow !== 'none'

  return (
    <FullscreenPage title={t('bottomNav.feed')}>
      <div className="feed" onWheel={onWheel} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="feed-video" aria-hidden="true" />

        <div className="feed-top">
          <span style={{ width: 40 }} />
          <div className="feed-tabs">
            <button type="button" className="feed-tab" aria-selected="true">{t('feed.tabNearby')}</button>
            <button
              type="button"
              className="feed-tab"
              aria-selected="false"
              disabled={MVP_STAGE < 2}
              style={MVP_STAGE < 2 ? { opacity: 0.5, cursor: 'default' } : undefined}
            >
              {t('feed.tabFriends')}
              {MVP_STAGE < 2 && <Lock size={12} />}
            </button>
          </div>
          <div className="row" style={{ gap: 0 }}>
            <IconButton icon={Search} label={t('common.search')} tone="on-dark" to="/suche" />
            <Menu
              align="right"
              dark
              width={260}
              trigger={({ toggle }) => (
                <IconButton icon={SlidersHorizontal} label={t('feed.settings')} tone="on-dark" onClick={toggle} />
              )}
            >
              {() => (
                <>
                  <p className="t-small c-on-dark-dim menu-title">{t('feed.settingsTitle')}</p>
                  {RADIUS_OPTIONS.map((r) => (
                    <button key={r} type="button" className="menu-item c-on-dark" onClick={() => setRadiusKm(r)}>
                      {r} km {radiusKm === r && <span className="c-accent">✓</span>}
                    </button>
                  ))}
                  <MenuSeparator />
                  <div className="row-between" style={{ padding: 'var(--sp-2) var(--sp-3)' }}>
                    <span className="t-small c-on-dark">{t('feed.onlyRated')}</span>
                    <Switch checked={onlyRated} onChange={setOnlyRated} label={t('feed.onlyRated')} />
                  </div>
                </>
              )}
            </Menu>
          </div>
        </div>

        {loading ? (
          <FeedSkeleton />
        ) : !video ? (
          <div className="feed-stage">
            <EmptyState
              onDark
              icon={Camera}
              title={t('feed.emptyTitle')}
              text={t('feed.emptyText')}
              action={<Button variant="primary" to="/karte">{t('feed.emptyCta')}</Button>}
              secondaryAction={
                radiusKm < 50
                  ? <Button variant="quiet" style={{ color: '#fff' }} onClick={() => setRadiusKm(50)}>{t('feed.emptyCtaSecondary')}</Button>
                  : undefined
              }
            />
          </div>
        ) : (
          <>
            {/* Blättern: wischen, Mausrad, Pfeiltasten — oder diese beiden Knöpfe */}
            <div className="feed-paging">
              <button type="button" onClick={() => go(-1)} disabled={index === 0} aria-label={t('common.back')}>
                <ChevronUp size={20} />
              </button>
              <span className="t-tiny c-on-dark-dim">{t('feed.ofCount', { current: index + 1, total: items.length })}</span>
              <button type="button" onClick={() => go(1)} disabled={index >= items.length - 1} aria-label={t('common.next')}>
                <ChevronDown size={20} />
              </button>
            </div>

            <div className="feed-rail">
              <button
                type="button"
                className="feed-rail-item"
                onClick={requireLogin(() => api.social.toggleFollow(null, video.author.id))}
                aria-label={t('feed.follow')}
              >
                <span className="feed-avatar-wrap">
                  <Avatar name={video.author?.username} size={44} />
                  {!following && <span className="feed-follow-plus"><Plus size={12} /></span>}
                </span>
              </button>

              <button
                type="button"
                className={`feed-rail-item ${liked ? 'is-active' : ''}`}
                onClick={requireLogin(() => api.social.toggleLike(null, video.id))}
                aria-pressed={!!liked}
                aria-label={t('feed.like')}
              >
                <Heart size={28} fill={liked ? 'currentColor' : 'none'} />
                <span className="count">{video.likeCount}</span>
              </button>

              <button
                type="button"
                className="feed-rail-item"
                style={commentsEnabled ? undefined : { opacity: 0.5 }}
                aria-disabled={!commentsEnabled}
                aria-label={t('feed.comment')}
              >
                <MessageCircle size={28} />
              </button>

              <button
                type="button"
                className={`feed-rail-item ${saved ? 'is-active' : ''}`}
                onClick={requireLogin(async () => {
                  const now = await api.social.toggleSave(null, 'video', video.id)
                  toast(now ? t('toast.saved') : t('common.removed'))
                })}
                aria-pressed={!!saved}
                aria-label={t('feed.save')}
              >
                <Bookmark size={28} fill={saved ? 'currentColor' : 'none'} />
              </button>

              <button type="button" className="feed-rail-item" onClick={() => toast(t('toast.linkCopied'))} aria-label={t('feed.share')}>
                <Share2 size={28} />
              </button>

              <Menu
                align="right"
                dark
                trigger={({ toggle }) => (
                  <button type="button" className="feed-rail-item" onClick={toggle} aria-label={t('feed.moreOptions')}>
                    <Ellipsis size={28} />
                  </button>
                )}
              >
                {({ close }) => (
                  <>
                    <MenuItem onClick={() => { close(); api.videos.markSeen(video.id); go(1) }}>{t('feed.menu.notInterested')}</MenuItem>
                    <MenuItem onClick={() => { close(); toast(t('toast.linkCopied')) }}>{t('feed.menu.copyLink')}</MenuItem>
                    <MenuItem onClick={() => { close(); setReportOpen(true) }}>{t('feed.menu.reportVideo')}</MenuItem>
                    <MenuItem danger onClick={close}>{t('feed.menu.blockAuthor')}</MenuItem>
                    <MenuSeparator />
                    <MenuItem onClick={close}>{t('common.cancel')}</MenuItem>
                  </>
                )}
              </Menu>
            </div>

            <div className="feed-bottom">
              <div className="feed-caption-block stack-2">
                <div className="row" style={{ gap: 'var(--sp-2)' }}>
                  <button
                    type="button"
                    className="t-body-bold c-on-dark"
                    style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
                    onClick={() => navigate(`/p/${video.author.username}`)}
                  >
                    @{video.author?.username}
                  </button>
                  {video.verifiedOnSite && <OnSiteBadge tone="dark" />}
                </div>
                <p className="t-body c-on-dark clamp-2">{video.caption}</p>
                <button
                  type="button"
                  className="t-small c-on-dark-dim"
                  style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left' }}
                  onClick={() => navigate(`/v/${video.id}`)}
                >
                  {t('common.more')}
                </button>
                {video.review && (
                  <RatingCompact
                    rating={{ food: video.review.ratingFood, service: video.review.ratingService, price: video.review.ratingPrice }}
                    onDark
                  />
                )}
              </div>

              {/* Kaltstart: zu wenig in der Nähe (8.4) */}
              {data?.widened && (
                <div className="feed-coldstart">
                  <span className="grow">{t('feed.coldStart')}</span>
                  <Button variant="quiet" size="sm" to="/karte" style={{ color: '#fff' }}>{t('feed.coldStartCta')}</Button>
                </div>
              )}

              <button type="button" className="feed-place-bar" onClick={() => navigate(`/g/${video.place.slug}`)}>
                <span className="thumb-placeholder" style={{ width: 40, height: 40, background: 'rgba(255,255,255,.16)', color: 'rgba(255,255,255,.6)' }}>
                  <UtensilsCrossed size={16} />
                </span>
                <span className="grow" style={{ textAlign: 'left' }}>
                  <span className="t-body-bold c-on-dark row" style={{ gap: 4 }}>
                    {video.place.name}
                    {video.place.verified && <BadgeCheck size={15} style={{ color: '#8FBBEE' }} />}
                  </span>
                  <span className="t-small c-on-dark-dim">
                    {video.place.cuisine} · {formatDistance(video.place.distanceKm)} · {video.place.open ? t('common.openNow') : t('hours.closed')}
                  </span>
                  <ServingRow serving={video.place.serving} size="sm" max={5} className="feed-serving" />
                </span>
                <ChevronRight size={20} />
              </button>
            </div>
          </>
        )}
      </div>

      <ReportContentDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        target={video ? { type: 'video', id: video.id, label: `${video.id} · ${video.place?.name}` } : null}
      />
    </FullscreenPage>
  )
}

function FeedSkeleton() {
  return (
    <>
      <div className="feed-rail">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} dark w={32} h={32} radius="50%" />
        ))}
      </div>
      <div className="feed-bottom">
        <div className="stack-2" style={{ maxWidth: '70%' }}>
          <Skeleton dark w={120} h={14} />
          <Skeleton dark w="100%" h={12} />
          <Skeleton dark w="70%" h={12} />
        </div>
        <Skeleton dark h={56} radius="var(--r-control)" style={{ marginTop: 'var(--sp-3)' }} />
      </div>
    </>
  )
}
