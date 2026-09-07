import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Bookmark, Camera, ClipboardList, Ellipsis, Lock, Settings, Share2, UserRound } from 'lucide-react'
import { Avatar, Badge, Button, EmptyState, IconButton, LoadingBlock, Menu, MenuItem, ReviewCard, ReviewCardSkeleton, Skeleton, SkeletonTile, Spinner, Tabs, VideoTile, useToast,  } from '../../design/ui'
import { PlaceRow } from '../../components/PlaceRowConnected'
import { Page } from '../../components/layout'
import { ReportContentDialog } from '../dialogs/ReportContentDialog'
import { useSession } from '../../lib/session'
import { useRequireLogin } from '../../lib/auth'
import { api, useQuery } from '../../lib/store'
import { useVariant } from '../../lib/design-state'
import { t } from '../../design/i18n'

const TABS = [
  { id: 'videos', label: t('profile.tabs.videos') },
  { id: 'reviews', label: t('profile.tabs.reviews') },
  { id: 'saved', label: t('profile.tabs.saved') },
]

/** E.7 — Eigenes Profil */
export function OwnProfile() {
  const [params] = useSearchParams()
  const [tab, setTab] = useState(params.get('tab') === 'saved' ? 'saved' : 'videos')
  const { user, loggedIn, userId } = useSession()
  const toast = useToast()

  if (!loggedIn) {
    return (
      <Page title={t('profile.guestTitle')} footer={false}>
        <div style={{ paddingBlock: 'var(--sp-16)' }}>
          <EmptyState
            icon={UserRound}
            title={t('profile.guestTitle')}
            text={t('profile.guestText')}
            action={<Button variant="primary" to="/anmelden">{t('auth.gate.login')}</Button>}
            secondaryAction={<Button variant="secondary" to="/registrieren">{t('auth.gate.register')}</Button>}
          />
        </div>
      </Page>
    )
  }

  return (
    <Page title={`@${user.username}`} footer={false}>
      <ProfileHeader
        user={user}
        loading={false}
        actions={
          <>
            <Button variant="secondary" to="/einstellungen/profil">{t('profile.edit')}</Button>
            <IconButton icon={Share2} label={t('common.share')} onClick={() => toast(t('toast.linkCopied'))} />
            <IconButton icon={Settings} label={t('profile.settings')} to="/einstellungen" />
          </>
        }
      />

      <Tabs items={TABS} value={tab} onChange={setTab} />

      <div style={{ paddingBlock: 'var(--sp-6) var(--sp-16)' }}>
        {tab === 'videos' && <VideosTab userId={userId} own />}
        {tab === 'reviews' && <ReviewsTab userId={userId} own />}
        {tab === 'saved' && <SavedTab userId={userId} />}
      </div>
    </Page>
  )
}

/** E.8 — Fremdes Profil */
export function PublicProfile() {
  const { username } = useParams()
  const { userId, loggedIn } = useSession()
  const [tab, setTab] = useState('videos')
  const [reportOpen, setReportOpen] = useState(false)
  const toast = useToast()
  const requireLogin = useRequireLogin()
  const navigate = useNavigate()

  const { data: user, loading } = useVariant(useQuery(() => api.users.byUsername(username), [username]))

  const follow = user?.viewerFollow ?? 'none'
  const followLabel = {
    none: t('profile.follow'),
    pending: t('profile.requested'),
    accepted: `${t('profile.following')} ✓`,
  }

  if (loading) {
    return (
      <Page title={t('common.loading')} footer={false}>
        <ProfileHeader loading />
        <LoadingBlock />
      </Page>
    )
  }

  if (!user) {
    return (
      <Page title={t('errors.e404.title')} footer={false}>
        <div style={{ paddingBlock: 'var(--sp-16)' }}>
          <EmptyState
            icon={UserRound}
            title={t('errors.e404.title')}
            text={t('errors.e404.text')}
            action={<Button variant="primary" to="/suche">{t('common.search')}</Button>}
          />
        </div>
      </Page>
    )
  }

  const hidden = user.private && follow !== 'accepted' && user.id !== userId

  return (
    <Page title={`@${user.username}`} footer={false}>
      <ProfileHeader
        user={user}
        actions={
          <>
            <Button
              variant={follow === 'none' ? 'primary' : 'secondary'}
              onClick={requireLogin(() => api.social.toggleFollow(null, user.id))}
            >
              {followLabel[follow]}
            </Button>
            <Menu
              align="right"
              trigger={({ toggle }) => <IconButton icon={Ellipsis} label={t('common.more')} onClick={toggle} />}
            >
              {({ close }) => (
                <>
                  <MenuItem icon={Share2} onClick={() => { close(); toast(t('toast.linkCopied')) }}>{t('common.share')}</MenuItem>
                  <MenuItem onClick={requireLogin(() => { close(); toast(t('toast.saved')) })}>{t('profile.block')}</MenuItem>
                  <MenuItem danger onClick={() => { close(); setReportOpen(true) }}>{t('common.report')}</MenuItem>
                </>
              )}
            </Menu>
          </>
        }
      />

      {hidden ? (
        <div style={{ paddingBlock: 'var(--sp-12) var(--sp-16)' }}>
          <EmptyState
            icon={Lock}
            title={t('profile.privateTitle')}
            text={t('profile.privateText', { username: `@${user.username}` })}
          />
        </div>
      ) : (
        <>
          <Tabs items={TABS.slice(0, 2)} value={tab} onChange={setTab} />
          <div style={{ paddingBlock: 'var(--sp-6) var(--sp-16)' }}>
            {tab === 'videos' && <VideosTab userId={user.id} />}
            {tab === 'reviews' && <ReviewsTab userId={user.id} />}
          </div>
        </>
      )}

      <ReportContentDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        target={{ type: 'profile', id: user.id, label: `@${user.username}` }}
      />
    </Page>
  )
}

function ProfileHeader({ user, actions, loading }) {
  return (
    <section
      style={{ paddingBlock: 'var(--sp-8)', display: 'grid', gap: 'var(--sp-3)', justifyItems: 'center', textAlign: 'center' }}
    >
      {loading || !user ? (
        <>
          <Skeleton w={96} h={96} radius="50%" />
          <Skeleton w={160} h={20} />
          <Skeleton w={220} h={12} />
          <Spinner label={t('common.loading')} />
        </>
      ) : (
        <>
          <Avatar name={user.username} size={96} />
          <div>
            <h1 className="t-h1">@{user.username}</h1>
            <p className="t-body c-secondary">{user.name}</p>
          </div>
          {user.bio && <p className="t-body clamp-3" style={{ maxWidth: 460 }}>{user.bio}</p>}
          <div className="row" style={{ gap: 'var(--sp-6)' }}>
            <span className="t-body"><strong>{user.videoCount}</strong> <span className="c-secondary">{t('profile.counts.videos')}</span></span>
            <span className="t-body"><strong>{user.followerCount}</strong> <span className="c-secondary">{t('profile.counts.followers')}</span></span>
            <span className="t-body"><strong>{user.followingCount}</strong> <span className="c-secondary">{t('profile.counts.following')}</span></span>
          </div>
          {user.private && <Badge icon={Lock}>{t('common.privateProfile')}</Badge>}
          <div className="row-wrap" style={{ justifyContent: 'center' }}>{actions}</div>
        </>
      )}
    </section>
  )
}

/**
 * Die Kacheln laden jetzt wirklich — deshalb gibt es hier auch wirklich
 * einen Ladezustand: Skelettkacheln plus Kreisel, statt eines Sprungs
 * von leer auf voll.
 */
function VideosTab({ userId, own }) {
  const { data, loading } = useVariant(
    useQuery(() => api.videos.byAuthor(userId, { own }), [userId, own], { initial: [] }),
  )
  const list = data ?? []

  if (loading) {
    return (
      <>
        <div className="video-grid">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonTile key={i} />)}
        </div>
        <div className="refresh-bar"><Spinner label={t('common.loading')} /></div>
      </>
    )
  }

  if (list.length === 0) {
    return (
      <EmptyState
        icon={Camera}
        title={t('profile.empty.videosTitle')}
        text={t('profile.empty.videosText')}
        action={own ? <Button variant="primary" to="/upload">{t('profile.empty.videosCta')}</Button> : undefined}
      />
    )
  }

  return (
    <div className="video-grid">
      {list.map((v) => (
        <VideoTile
          key={v.id}
          to={`/v/${v.id}`}
          views={v.views.toLocaleString('de-DE')}
          locked={v.visibility !== 'public'}
          pending={v.status === 'pending_review'}
        />
      ))}
    </div>
  )
}

function ReviewsTab({ userId, own }) {
  const { data, loading } = useVariant(
    useQuery(() => api.reviews.byAuthor(userId), [userId], { initial: [] }),
  )
  const list = data ?? []

  if (loading) return <div className="stack-4">{Array.from({ length: 2 }).map((_, i) => <ReviewCardSkeleton key={i} />)}</div>
  if (list.length === 0) {
    return <EmptyState icon={ClipboardList} title={t('profile.empty.reviewsTitle')} text={t('profile.empty.reviewsText')} />
  }
  return (
    <div className="stack-4">
      {list.map((r) => <ReviewCard key={r.id} review={r} variant={own ? 'own' : 'public'} placeName={r.placeName} />)}
    </div>
  )
}

function SavedTab({ userId }) {
  const [sub, setSub] = useState('videos')
  const { data, loading } = useVariant(
    useQuery(() => api.social.saved(null, sub === 'videos' ? 'video' : 'place'), [userId, sub], { initial: [] }),
  )
  const list = data ?? []

  return (
    <div>
      <div className="row-wrap" style={{ marginBottom: 'var(--sp-4)' }}>
        {['videos', 'places'].map((k) => (
          <button key={k} type="button" className="chip" aria-pressed={sub === k} onClick={() => setSub(k)}>
            {t(`profile.savedTabs.${k}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingBlock />
      ) : list.length === 0 ? (
        <EmptyState icon={Bookmark} title={t('profile.empty.savedTitle')} text={t('profile.empty.savedText')} />
      ) : sub === 'videos' ? (
        <div className="video-grid">
          {list.map((v) => <VideoTile key={v.id} to={`/v/${v.id}`} views={v.views.toLocaleString('de-DE')} />)}
        </div>
      ) : (
        <div className="list-group">
          {list.map((p) => <PlaceRow key={p.id} place={p} />)}
        </div>
      )}
    </div>
  )
}
