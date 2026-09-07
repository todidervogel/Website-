import { useState } from 'react'
import { ChevronRight, Compass, Info, MapPin, Navigation, UtensilsCrossed } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, IconButton, Skeleton, VideoTile } from '../../design/ui'
import { Page } from '../../components/layout'
import { useDesignState, useVariant } from '../../lib/design-state'
import { api, toMapPercent, useQuery } from '../../lib/store'
import { t } from '../../design/i18n'

/** C.1 — Startseite */
export default function Home() {
  const { position, radiusKm, setPosition } = useDesignState()
  const navigate = useNavigate()
  const [where, setWhere] = useState('')

  const { data: feed, loading: feedLoading } = useVariant(
    useQuery(() => api.videos.feed({ position, radiusKm: Math.max(radiusKm, 10) }), [position, radiusKm], {
      initial: { items: [] },
    }),
  )
  const { data: nearby, loading: mapLoading } = useVariant(
    useQuery(() => api.places.nearby(position, 12), [position], { initial: [] }),
  )

  const isLoading = feedLoading
  const tiles = (feed?.items ?? []).slice(0, 8)
  const markers = nearby ?? []

  /* Ortssuche: Treffer verschiebt den Kartenmittelpunkt, sonst zur Suche. */
  const goToPlace = async (event) => {
    event.preventDefault()
    const value = where.trim()
    if (!value) return navigate('/karte')
    const result = await api.search.run(value, { position })
    const hit = result.locations[0]
    if (hit) setPosition({ lat: hit.lat, lng: hit.lng, label: hit.name })
    return navigate(hit ? '/karte' : `/suche?q=${encodeURIComponent(value)}`)
  }

  return (
    <Page title={t('home.title')}>
      {/* Abschnitt 1 — Kopfbereich */}
      <section className="section" style={{ maxWidth: 720 }}>
        <h1 className="t-display">{t('home.title')}</h1>
        <p className="t-body c-secondary" style={{ marginTop: 'var(--sp-3)' }}>{t('home.subtitle')}</p>

        <form className="row-wrap" style={{ marginTop: 'var(--sp-6)', gap: 'var(--sp-2)' }} onSubmit={goToPlace}>
          <div className="input-affix grow" style={{ minWidth: 260 }}>
            <span className="affix"><MapPin size={18} /></span>
            <input
              className="input"
              placeholder={t('home.locationPlaceholder')}
              aria-label={t('home.locationPlaceholder')}
              value={where}
              onChange={(e) => setWhere(e.target.value)}
            />
            <Button variant="quiet" size="sm" icon={Navigation} onClick={() => setWhere(position.label ?? '')}>
              {t('home.useLocation')}
            </Button>
          </div>
          <Button type="submit" variant="primary">{t('home.go')}</Button>
        </form>
      </section>

      {/* Abschnitt 2 — Videovorschau */}
      <section style={{ paddingBottom: 'var(--sp-12)' }}>
        <div className="row-between" style={{ marginBottom: 'var(--sp-4)' }}>
          <h2 className="t-h2">{t('home.popularTitle')}</h2>
          <IconButton icon={ChevronRight} label={t('home.popularNext')} to="/feed" />
        </div>

        {isLoading ? (
          <div className="video-rail">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} w={180} h={320} radius="var(--r-card)" style={{ flex: 'none' }} />
            ))}
          </div>
        ) : tiles.length === 0 ? (
          <div className="card card-flat" style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>
            <p className="t-body c-secondary">{t('feed.emptyText')}</p>
          </div>
        ) : (
          <div className="video-rail">
            {tiles.map((v) => (
              <VideoTile
                key={v.id}
                to={`/v/${v.id}`}
                title={v.place?.name}
                subtitle={v.place?.distance}
                views={v.views.toLocaleString('de-DE')}
              />
            ))}
          </div>
        )}
      </section>

      {/* Abschnitt 3 — Kartenvorschau */}
      <section style={{ paddingBottom: 'var(--sp-12)' }}>
        <h2 className="t-h2" style={{ marginBottom: 'var(--sp-4)' }}>{t('home.mapTitle')}</h2>
        <div className="map-canvas" style={{ height: 400, borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
          {!mapLoading && markers.map((p) => {
            const { top, left } = toMapPercent(p, position, 14)
            if (top < 0 || top > 100 || left < 0 || left > 100) return null
            return (
              <span key={p.id} className="marker" style={{ top: `${top}%`, left: `${left}%` }}>
                <span className={p.videoCount > 0 ? 'marker-video' : 'marker-dot'}>
                  <UtensilsCrossed size={p.videoCount > 0 ? 16 : 11} />
                </span>
              </span>
            )
          })}
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <Button variant="primary" to="/karte">{t('home.openMap')}</Button>
          </div>
          <div className="map-attribution">{t('footer.mapData')}</div>
        </div>
      </section>

      {/* Abschnitt 4 — So funktioniert's */}
      <section style={{ paddingBottom: 'var(--sp-12)' }}>
        <h2 className="t-h2" style={{ marginBottom: 'var(--sp-6)' }}>{t('home.howTitle')}</h2>
        <div style={{ display: 'grid', gap: 'var(--sp-6)', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {[
            [Compass, 'discoverTitle', 'discoverText'],
            [Info, 'informTitle', 'informText'],
            [Navigation, 'goTitle', 'goText'],
          ].map(([Icon, titleKey, textKey]) => (
            <div key={titleKey}>
              <Icon size={28} className="c-accent" />
              <h3 className="t-h3" style={{ marginTop: 'var(--sp-3)' }}>{t(`home.how.${titleKey}`)}</h3>
              <p className="t-body c-secondary" style={{ marginTop: 'var(--sp-1)' }}>{t(`home.how.${textKey}`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Abschnitt 5 — Für Gastronomen */}
      <section
        className="card card-flat"
        style={{ padding: 'var(--sp-8)', marginBottom: 'var(--sp-12)' }}
      >
        <h2 className="t-h2">{t('home.gastroTitle')}</h2>
        <p className="t-body c-secondary" style={{ marginTop: 'var(--sp-2)', maxWidth: 560 }}>{t('home.gastroText')}</p>
        <Button variant="primary" to="/gastro/eintragen" style={{ marginTop: 'var(--sp-4)' }}>
          {t('home.gastroCta')}
        </Button>
        <p className="t-small c-secondary" style={{ marginTop: 'var(--sp-3)' }}>
          <Link to="/fuer-gastronomen" className="c-accent">{t('header.forRestaurants')}</Link>
        </p>
      </section>
    </Page>
  )
}
