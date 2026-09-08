import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Bookmark, Flag, Heart, MessageCircle, Play, Share2, Video as VideoIcon } from 'lucide-react'
import { Avatar, Button, Card, Chip, EmptyState, LoadingBlock, OnSiteBadge, RatingCompact, Skeleton, useToast,  } from '../../design/ui'
import { PlaceRow } from '../../components/PlaceRowConnected'
import { Page } from '../../components/layout'
import { ReportContentDialog } from '../dialogs/ReportContentDialog'
import { useDesignState } from '../../lib/design-state'
import { useRequireLogin } from '../../lib/auth'
import { useSession } from '../../lib/session'
import { api, useQuery } from '../../lib/store'
import { MVP_STAGE } from '../../design/config'
import { groupSizeLabel, t } from '../../design/i18n'

/** C.7, Videodetailseite /v/[id] */
export default function VideoDetail() {
  const { id } = useParams()
  const { position } = useDesignState()
  const { userId, loggedIn } = useSession()
  const [reportOpen, setReportOpen] = useState(false)
  const toast = useToast()
  const requireLogin = useRequireLogin()

  const { data: video, loading } = 
    useQuery(() => api.videos.byId(id, position), [id, position])

  if (loading) {
    return (
      <Page title={t('common.loading')} footer={false}>
        <div className="split-video" style={{ paddingBlock: 'var(--sp-6) var(--sp-16)' }}>
          <Skeleton h={0} style={{ aspectRatio: '9 / 16', maxHeight: 640, height: 'auto' }} radius="var(--r-card)" />
          <div className="stack-4">
            <Skeleton h={40} /><Skeleton h={90} /><LoadingBlock minHeight={80} />
          </div>
        </div>
      </Page>
    )
  }

  if (!video) {
    return (
      <Page title={t('errors.e404.title')} footer={false}>
        <div style={{ paddingBlock: 'var(--sp-16)' }}>
          <EmptyState
            icon={VideoIcon}
            title={t('errors.e404.title')}
            text={t('errors.e404.text')}
            action={<Button variant="primary" to="/feed">{t('bottomNav.feed')}</Button>}
          />
        </div>
      </Page>
    )
  }

  const { author, place, review } = video
  const liked = !!video.viewerLiked
  const saved = !!video.viewerSaved
  const follow = author?.viewerFollow ?? 'none'
  const followLabel = { none: t('videoDetail.follow'), pending: t('profile.requested'), accepted: t('profile.following') }

  return (
    <Page title={place?.name ?? t('bottomNav.feed')} footer={false}>
      <div className="split-video" style={{ paddingBlock: 'var(--sp-6) var(--sp-16)' }}>
        <div
          style={{
            background: '#000', borderRadius: 'var(--r-card)', display: 'grid', placeItems: 'center',
            aspectRatio: '9 / 16', maxHeight: 640, margin: '0 auto', width: '100%',
          }}
        >
          <Play size={44} color="#fff" fill="#fff" strokeWidth={0} />
        </div>

        <div className="stack-4">
          <div className="row">
            <Avatar name={author?.username} size={40} />
            <div className="grow">
              <p className="t-body-bold">@{author?.username}</p>
              <p className="t-small c-secondary">{video.createdAt}</p>
            </div>
            <Button
              variant={follow === 'none' ? 'primary' : 'secondary'}
              size="sm"
              onClick={requireLogin(() => api.social.toggleFollow(null, author.id))}
            >
              {followLabel[follow]}
            </Button>
          </div>

          {place && <Card pad={0}><PlaceRow place={place} showSave={false} /></Card>}

          <Card className="stack-2">
            <div className="row" style={{ gap: 'var(--sp-2)' }}>
              {video.verifiedOnSite && <OnSiteBadge />}
            </div>

            {review ? (
              <>
                <RatingCompact rating={{ food: review.ratingFood, service: review.ratingService, price: review.ratingPrice }} />
                <p className="t-small c-secondary">
                  {groupSizeLabel(review.groupSize)}
                  {review.foodHot ? ` · ${t('place.foodHot')} ✓` : ''}
                </p>
                {review.dishes?.length > 0 && (
                  <div className="row-wrap">
                    {review.dishes.map((d) => <Chip key={d.name}>{d.name} ★{d.rating}</Chip>)}
                  </div>
                )}
                {review.text && <p className="t-body">{review.text}</p>}
              </>
            ) : (
              <p className="t-small c-tertiary">{t('menu.noRating')}</p>
            )}

            <p className="t-body">{video.caption}</p>
          </Card>

          <hr className="divider" />

          <div className="row-wrap">
            <Button
              variant="quiet" size="sm" icon={Heart}
              className={liked ? 'c-accent' : ''}
              onClick={requireLogin(() => api.social.toggleLike(null, video.id))}
            >
              {video.likeCount}
            </Button>
            <Button variant="quiet" size="sm" icon={MessageCircle} disabled={MVP_STAGE < 2}>{t('videoDetail.comments')}</Button>
            <Button
              variant="quiet" size="sm" icon={Bookmark}
              className={saved ? 'c-accent' : ''}
              onClick={requireLogin(async () => {
                const now = await api.social.toggleSave(null, 'video', video.id)
                toast(now ? t('toast.saved') : t('common.removed'))
              })}
            >
              {t('place.save')}
            </Button>
            <Button variant="quiet" size="sm" icon={Share2} onClick={() => toast(t('toast.linkCopied'))}>{t('common.share')}</Button>
            <Button variant="quiet" size="sm" icon={Flag} onClick={() => setReportOpen(true)}>{t('videoDetail.report')}</Button>
          </div>

          <hr className="divider" />

          {MVP_STAGE < 2 && (
            <EmptyState icon={MessageCircle} title={t('videoDetail.comments')} text={t('videoDetail.commentsSoon')} />
          )}
        </div>
      </div>

      <ReportContentDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        target={{ type: 'video', id: video.id, label: `${video.id} · ${place?.name}` }}
      />
    </Page>
  )
}
