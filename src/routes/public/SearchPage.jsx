import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MapPin, Search as SearchIcon, UtensilsCrossed, X } from 'lucide-react'
import { Avatar, Badge, Button, Chip, EmptyState, FilterChip, ServingPicker, SkeletonRow, SkeletonTile, Stars, Tabs, Thumb, VideoTile, Checkbox, Radio,  } from '../../design/ui'
import { PlaceRow } from '../../components/PlaceRowConnected'
import { Page } from '../../components/layout'
import { useDesignState } from '../../lib/design-state'
import { useRequireLogin } from '../../lib/auth'
import { useSession } from '../../lib/session'
import { api, useQuery } from '../../lib/store'
import { RADIUS_OPTIONS, PRICE_LEVELS } from '../../design/config'
import { SERVING_KEYS } from '../../design/vocabulary'
import { searchPopular } from '../../domain/seed'
import { t } from '../../design/i18n'

const TABS = [
  { id: 'dishes', label: t('search.tabs.dishes') },
  { id: 'places', label: t('search.tabs.places') },
  { id: 'locations', label: t('search.tabs.locations') },
  { id: 'profiles', label: t('search.tabs.profiles') },
]

const RATING_LIMITS = { all: 0, from3: 3, from4: 4, from45: 4.5 }
const CATEGORIES = ['restaurant', 'cafe', 'bar', 'imbiss']

/** C.5 — Suchergebnisse */
export default function SearchPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { position, radiusKm, setRadiusKm, setPosition } = useDesignState()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [tab, setTab] = useState('dishes')
  const [categories, setCategories] = useState([])
  const [serving, setServing] = useState([])
  const [prices, setPrices] = useState([])
  const [ratingKey, setRatingKey] = useState('all')
  const [history, setHistory] = useState([])

  /*
   * Vorschläge für die leere Suche. Sie laufen nur, solange nichts getippt ist
   * — wer sucht, will Treffer sehen und keine Anregungen.
   */
  const { data: entdeckenDaten, loading: entdeckenLaedt } = useQuery(
    () => api.videos.feed({ position, radiusKm: Math.max(radiusKm, 25) }),
    [position, radiusKm, query.length === 0],
    { initial: { items: [] }, enabled: query.length === 0 },
  )
  const entdecken = (entdeckenDaten?.items ?? []).slice(0, 12)

  const { data: naheBetriebeDaten } = useQuery(
    () => api.places.nearby(position, 12),
    [position, query.length === 0],
    { initial: [], enabled: query.length === 0 },
  )
  const naheBetriebe = naheBetriebeDaten ?? []

  /* Erst tippen lassen, dann suchen — sonst rennt die Abfrage jedem Zeichen hinterher. */
  const [debounced, setDebounced] = useState(query)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 250)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (debounced) setParams({ q: debounced }, { replace: true })
  }, [debounced, setParams])

  const { data, loading } = 
    useQuery(() => api.search.run(debounced, { position }), [debounced, position], {
      initial: { dishes: [], places: [], locations: [], profiles: [] },
    })

  /* Nachfiltern, was der Suchdienst nicht selbst weiß. */
  const filtered = useMemo(() => {
    const inRadius = (p) => p.distanceKm == null || p.distanceKm <= radiusKm
    const matches = (p) =>
      inRadius(p) &&
      (categories.length === 0 || categories.includes(p.category)) &&
      (serving.length === 0 || serving.every((s) => p.serving?.includes(s))) &&
      (prices.length === 0 || prices.includes(p.price)) &&
      (p.rating?.food ?? 0) >= RATING_LIMITS[ratingKey]

    return {
      dishes: (data?.dishes ?? []).filter((d) => matches(d.place)),
      places: (data?.places ?? []).filter(matches),
      locations: data?.locations ?? [],
      profiles: data?.profiles ?? [],
    }
  }, [data, radiusKm, categories, serving, prices, ratingKey])

  /* Der Verlauf liegt bei den Daten, nicht im Screen. */
  useEffect(() => { api.search.history().then(setHistory) }, [])

  const remember = async () => {
    if (!query.trim()) return
    setHistory(await api.search.remember(query))
  }

  const activeFilters = categories.length + serving.length + prices.length + (ratingKey === 'all' ? 0 : 1)
  const results = filtered[tab] ?? []

  return (
    <Page title={t('search.title')} footer={false}>
      <div style={{ paddingBlock: 'var(--sp-6)' }}>
        <form
          className="header-search"
          style={{ maxWidth: 'none' }}
          onSubmit={(e) => { e.preventDefault(); remember() }}
          role="search"
        >
          <SearchIcon size={18} className="search-icon" />
          <input
            className="input"
            style={{ height: 44 }}
            placeholder={t('search.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={remember}
            aria-label={t('common.search')}
          />
          {query && (
            <button type="button" className="menu-search-clear" onClick={() => setQuery('')} aria-label={t('common.clear')}>
              <X size={16} />
            </button>
          )}
        </form>
      </div>

      {query.length === 0 ? (
        <div className="stack-6" style={{ paddingBottom: 'var(--sp-16)' }}>
          {history.length > 0 && (
            <div>
              <h2 className="t-small c-secondary" style={{ marginBottom: 'var(--sp-2)' }}>{t('search.recent')}</h2>
              <div className="row-wrap">
                {history.map((r) => (
                  <span className="chip" key={r}>
                    <button
                      type="button"
                      onClick={() => setQuery(r)}
                      style={{ border: 0, background: 'none', cursor: 'pointer', padding: 0, font: 'inherit', color: 'inherit' }}
                    >
                      {r}
                    </button>
                    <button
                      type="button"
                      aria-label={t('search.removeRecent')}
                      onClick={() => { setHistory((list) => list.filter((x) => x !== r)) }}
                      style={{ border: 0, background: 'none', cursor: 'pointer', padding: 0, display: 'grid' }}
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
          <div>
            <h2 className="t-small c-secondary" style={{ marginBottom: 'var(--sp-2)' }}>{t('search.popularNearby')}</h2>
            <div className="row-wrap">
              {searchPopular.map((p) => <Chip key={p} onClick={() => setQuery(p)}>{p}</Chip>)}
            </div>
          </div>

          {/*
            * Vorschläge statt leerer Fläche. Unter der Suchzeile stand bisher
            * nichts als Weiß — dabei ist genau das die Stelle, an der man sich
            * umsieht, ohne zu wissen wonach. Instagram macht daraus sein
            * Explore: ein Raster mit Sachen aus der Gegend.
            */}
          <div>
            <h2 className="t-small c-secondary" style={{ marginBottom: 'var(--sp-2)' }}>{t('search.discover')}</h2>
            {entdeckenLaedt ? (
              <div className="video-grid">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonTile key={i} />)}
              </div>
            ) : entdecken.length > 0 ? (
              <div className="video-grid">
                {entdecken.map((v) => (
                  <VideoTile key={v.id} video={v} onClick={() => navigate(`/v/${v.id}`)} />
                ))}
              </div>
            ) : (
              <p className="t-small c-secondary">{t('search.discoverEmpty')}</p>
            )}
          </div>

          {/* Und die Betriebe drumherum — nicht jeder sucht ein Video. */}
          {naheBetriebe.length > 0 && (
            <div>
              <h2 className="t-small c-secondary" style={{ marginBottom: 'var(--sp-2)' }}>{t('search.nearbyPlaces')}</h2>
              <div className="list-group">
                {naheBetriebe.slice(0, 6).map((betrieb) => (
                  <PlaceRow key={betrieb.id} place={betrieb} showSave />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="row-between" style={{ gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
            <Tabs
              items={TABS.map((item) => ({ ...item, label: `${item.label} (${filtered[item.id]?.length ?? 0})` }))}
              value={tab}
              onChange={setTab}
              className="grow"
            />
            <div className="row-wrap">
              <FilterChip label={t('common.radiusValue', { value: radiusKm })} align="right">
                {({ close }) => (
                  <>
                    {RADIUS_OPTIONS.map((r) => (
                      <button key={r} type="button" className="menu-item" onClick={() => { setRadiusKm(r); close() }}>
                        {r} km {radiusKm === r && <span className="c-accent">✓</span>}
                      </button>
                    ))}
                  </>
                )}
              </FilterChip>

              <FilterChip
                label={activeFilters ? `${t('common.filter')} (${activeFilters})` : t('common.filter')}
                active={activeFilters > 0}
                align="right"
                width={300}
              >
                {({ close }) => (
                  <>
                    <p className="t-small c-secondary menu-title">{t('serving.filterTitle')}</p>
                    <div style={{ padding: '0 var(--sp-3)' }}>
                      <ServingPicker value={serving} onChange={setServing} keys={SERVING_KEYS} />
                    </div>

                    <p className="t-small c-secondary menu-title">{t('map.categoryMenuTitle')}</p>
                    <div style={{ padding: '0 var(--sp-3)' }}>
                      {CATEGORIES.map((c) => (
                        <Checkbox
                          key={c}
                          label={t(`categories.${c}`)}
                          checked={categories.includes(c)}
                          onChange={() => setCategories((v) => (v.includes(c) ? v.filter((x) => x !== c) : [...v, c]))}
                        />
                      ))}
                    </div>

                    <p className="t-small c-secondary menu-title">{t('map.ratingMenuTitle')}</p>
                    <div style={{ padding: '0 var(--sp-3)' }}>
                      {Object.keys(RATING_LIMITS).map((k) => (
                        <Radio
                          key={k}
                          name="s-rating"
                          label={t(`map.ratingOptions.${k}`)}
                          checked={ratingKey === k}
                          onChange={() => setRatingKey(k)}
                        />
                      ))}
                    </div>

                    <p className="t-small c-secondary menu-title">{t('map.priceMenuTitle')}</p>
                    <div className="row-wrap" style={{ padding: '0 var(--sp-3) var(--sp-2)' }}>
                      {PRICE_LEVELS.map((p) => (
                        <Chip
                          key={p}
                          active={prices.includes(p)}
                          onClick={() => setPrices((v) => (v.includes(p) ? v.filter((x) => x !== p) : [...v, p]))}
                        >
                          {p}
                        </Chip>
                      ))}
                    </div>

                    <div className="menu-actions">
                      <Button
                        variant="quiet" size="sm"
                        onClick={() => { setCategories([]); setServing([]); setPrices([]); setRatingKey('all') }}
                      >
                        {t('common.reset')}
                      </Button>
                      <span className="spacer" />
                      <Button variant="primary" size="sm" onClick={close}>{t('common.apply')}</Button>
                    </div>
                  </>
                )}
              </FilterChip>
            </div>
          </div>

          <div style={{ paddingBlock: 'var(--sp-6) var(--sp-16)' }}>
            {loading ? (
              <>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</>
            ) : results.length === 0 ? (
              <EmptyState
                icon={SearchIcon}
                title={t('search.emptyTitle', { query })}
                text={t('search.emptyText')}
                action={activeFilters > 0
                  ? <Button variant="secondary" onClick={() => { setCategories([]); setServing([]); setPrices([]); setRatingKey('all') }}>
                      {t('map.resetFilters')}
                    </Button>
                  : undefined}
              />
            ) : (
              <>
                {tab === 'dishes' && <DishResults items={results} />}
                {tab === 'places' && results.map((p) => <PlaceRow key={p.id} place={p} />)}
                {tab === 'locations' && <LocationResults items={results} onPick={setPosition} />}
                {tab === 'profiles' && <ProfileResults items={results} />}
              </>
            )}
          </div>
        </>
      )}
    </Page>
  )
}

function DishResults({ items }) {
  return (
    <div>
      {items.map((d) => (
        <Link to={`/g/${d.place.slug}/speisekarte`} className="place-row" key={d.id}>
          <Thumb size={64} icon={UtensilsCrossed} />
          <div className="grow">
            <p className="t-h3">{d.name}</p>
            <p className="t-small c-secondary">{d.place.name} · {d.place.distance}</p>
            <div className="row-wrap" style={{ gap: 4, marginTop: 4 }}>
              {(d.diet ?? []).map((k) => <Badge key={k} tone="success">{t(`diet.${k}`)}</Badge>)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="t-body-bold">{(d.priceCents / 100).toFixed(2).replace('.', ',')} €</p>
            {d.ratingCount > 0
              ? <Stars value={d.rating} size={12} />
              : <span className="t-small c-tertiary">{t('menu.noRating')}</span>}
          </div>
        </Link>
      ))}
    </div>
  )
}

/** Orte verschieben den Kartenmittelpunkt — Reiseplanung ohne vor Ort zu sein (8.8). */
function LocationResults({ items, onPick }) {
  return (
    <div>
      {items.map((l) => (
        <Link
          to="/karte"
          className="place-row"
          key={l.id}
          style={{ alignItems: 'center' }}
          onClick={() => onPick({ lat: l.lat, lng: l.lng, label: l.name })}
        >
          <Thumb size={40} radius="50%" icon={MapPin} />
          <div className="grow">
            <p className="t-body-bold">{l.name}</p>
            <p className="t-small c-secondary">{l.detail}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}

function ProfileResults({ items }) {
  const requireLogin = useRequireLogin()
  const { userId, loggedIn } = useSession()

  return (
    <div>
      {items.map((u) => {
        const state = u.viewerFollow ?? 'none'
        const label = { none: t('search.follow'), pending: t('search.requested'), accepted: t('search.following') }[state]
        return (
          <div className="place-row" key={u.id} style={{ alignItems: 'center' }}>
            <Avatar name={u.username} size={48} />
            <Link to={`/p/${u.username}`} className="grow" style={{ textDecoration: 'none' }}>
              <p className="t-body-bold">@{u.username}</p>
              <p className="t-small c-secondary">
                {t('search.profileMeta', { videos: u.videoCount, reviews: u.reviewCount })}
              </p>
            </Link>
            <Button
              variant={state === 'none' ? 'primary' : 'secondary'}
              size="sm"
              onClick={requireLogin(() => api.social.toggleFollow(null, u.id))}
            >
              {label}
            </Button>
          </div>
        )
      })}
    </div>
  )
}
