import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft, Crosshair, Maximize2, Minimize2, Search, SquarePlay, UtensilsCrossed, X,
} from 'lucide-react'
import { Button, Chip, FilterChip, SkeletonRow, EmptyState, Checkbox, Radio, IconButton, ServingPicker, ServingRow, Spinner, RatingCompact, VerifiedMark,  } from '../../design/ui'
import { PlaceRow } from '../../components/PlaceRowConnected'
import { BarePage } from '../../components/layout'
import { useDesignState } from '../../lib/design-state'
import { api, formatDistance, useQuery } from '../../lib/store'
import { MapTiles } from '../../components/MapTiles'
import { openSentence } from '../../lib/hours-text'
import { RADIUS_OPTIONS, PRICE_LEVELS } from '../../design/config'
import { SERVING_KEYS } from '../../design/vocabulary'
import { t } from '../../design/i18n'

const CATEGORIES = ['restaurant', 'cafe', 'bar', 'imbiss', 'baeckerei', 'eisdiele', 'pub']
const RATING_LIMITS = { all: 0, from3: 3, from4: 4, from45: 4.5 }

/**
 * Wie weit reicht der Kartenausschnitt bei diesem Umkreis? Etwas mehr als der
 * Umkreis selbst, damit die Marker am Rand nicht abgeschnitten wirken, aber
 * nicht zu viel, sonst klumpen sie in der Mitte.
 */
const spanFor = (radiusKm) => Math.max(2, radiusKm * 1.6)

/** C.2, Kartenansicht */
export default function MapView() {
  const { position, radiusKm, setRadiusKm, pureMap, setPureMap, isMobile } = useDesignState()
  /*
   * Die Projektion kommt vom Kartenschirm, nur er weiß, wie breit er ist,
   * und ohne dieselbe Rechnung säßen die Marker neben ihren Kacheln.
   */
  const [projizieren, setProjizieren] = useState(null)

  const [query, setQuery] = useState('')
  const [openNow, setOpenNow] = useState(false)
  const [onlyVideos, setOnlyVideos] = useState(false)
  const [categories, setCategories] = useState([])
  const [serving, setServing] = useState([])
  const [prices, setPrices] = useState([])
  const [ratingKey, setRatingKey] = useState('all')
  const [selected, setSelected] = useState(null)

  const filters = useMemo(() => ({
    position, radiusKm, query, openNow, onlyVideos, categories, serving, prices,
    minRating: RATING_LIMITS[ratingKey],
  }), [position, radiusKm, query, openNow, onlyVideos, categories, serving, prices, ratingKey])

  const { data, loading, refreshing } = 
    useQuery(() => api.places.list(filters), [JSON.stringify(filters)], { initial: [] })
  const list = data ?? []

  /* Die reine Kartenansicht sperrt das Scrollen der Seite dahinter. */
  useEffect(() => {
    document.body.classList.toggle('map-pure', pureMap)
    return () => document.body.classList.remove('map-pure')
  }, [pureMap])

  const activeFilters =
    (openNow ? 1 : 0) + (onlyVideos ? 1 : 0) + categories.length + serving.length + prices.length +
    (ratingKey === 'all' ? 0 : 1)

  const resetFilters = () => {
    setOpenNow(false); setOnlyVideos(false); setCategories([]); setServing([])
    setPrices([]); setRatingKey('all'); setQuery('')
  }

  const toggle = (setter) => (value) =>
    setter((current) => (current.includes(value) ? current.filter((x) => x !== value) : [...current, value]))

  const selectedPlace = list.find((p) => p.id === selected)

  const results = loading ? (
    <>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</>
  ) : list.length === 0 ? (
    <EmptyState
      icon={Search}
      title={t('map.emptyTitle')}
      text={t('map.emptyText')}
      action={
        activeFilters > 0
          ? <Button variant="secondary" onClick={resetFilters}>{t('map.resetFilters')}</Button>
          : <Button variant="secondary" onClick={() => setRadiusKm(25)}>{t('map.emptyCta')}</Button>
      }
    />
  ) : (
    <>
      <p className="t-small c-secondary" style={{ padding: 'var(--sp-3) var(--sp-4) 0' }}>
        {list.length === 1 ? t('map.resultCountOne') : t('map.resultCount', { count: list.length })}
        {refreshing && <Spinner size={14} inline className="spin-badge-inline" />}
      </p>
      {list.map((p) => <PlaceRow key={p.id} place={p} />)}
    </>
  )

  return (
    <BarePage title={t('map.title')} chrome={!pureMap}>
      <div className={`map-page ${pureMap ? 'is-pure' : ''}`}>
        <div className="map-layout">
          {/* Rechner: Ergebnisliste links. Auf dem Handy gar nicht erst
              erzeugen, sonst steht dieselbe Liste zweimal im Dokument. */}
          {!pureMap && !isMobile && <aside className="map-list">{results}</aside>}

          <div className="map-canvas">
            <MapTiles center={position} spanKm={spanFor(radiusKm)} onProject={setProjizieren} />
            {pureMap && (
              <span className="map-pure-exit">
                <IconButton icon={ChevronLeft} label={t('map.pureModeOff')} tone="glass" onClick={() => setPureMap(false)} />
              </span>
            )}

            {!pureMap && (
              <div className="map-overlay-top">
                <div className="map-toolbar">
                  <div className="header-search" style={{ maxWidth: 'none' }}>
                    <Search size={18} className="search-icon" />
                    <input
                      className="input"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t('map.searchHere')}
                      aria-label={t('map.searchHere')}
                    />
                    {query && (
                      <button type="button" className="menu-search-clear" onClick={() => setQuery('')} aria-label={t('common.clear')}>
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  <div className="chip-scroll">
                    <FilterChip label={t('common.radiusValue', { value: radiusKm })} active>
                      {({ close }) => (
                        <>
                          <p className="dropdown-title">{t('map.radiusMenuTitle')}</p>
                          {RADIUS_OPTIONS.map((r) => (
                            <button key={r} type="button" className="menu-item" onClick={() => { setRadiusKm(r); close() }}>
                              {r} km {radiusKm === r && <span className="c-accent">✓</span>}
                            </button>
                          ))}
                        </>
                      )}
                    </FilterChip>

                    <Chip active={openNow} onClick={() => setOpenNow((v) => !v)}>{t('common.openNow')}</Chip>

                    {/* Angebot: der Filter zum Wunsch „auf einen Blick sehen, was es gibt" */}
                    <FilterChip label={serving.length ? `${t('serving.label')} (${serving.length})` : t('serving.label')} active={serving.length > 0} width={320}>
                      {({ close }) => (
                        <>
                          <p className="dropdown-title">{t('map.servingMenuTitle')}</p>
                          <div style={{ padding: '0 var(--sp-3)' }}>
                            <ServingPicker value={serving} onChange={setServing} keys={SERVING_KEYS} />
                            <p className="t-tiny c-tertiary" style={{ marginTop: 'var(--sp-2)' }}>{t('serving.filterHint')}</p>
                          </div>
                          <div className="dropdown-actions">
                            <Button variant="quiet" size="sm" onClick={() => setServing([])}>{t('common.reset')}</Button>
                            <span className="spacer" />
                            <Button variant="primary" size="sm" onClick={close}>{t('common.apply')}</Button>
                          </div>
                        </>
                      )}
                    </FilterChip>

                    <FilterChip label={t('common.category')} active={categories.length > 0}>
                      {({ close }) => (
                        <>
                          <p className="dropdown-title">{t('map.categoryMenuTitle')}</p>
                          <div style={{ padding: '0 var(--sp-3)' }}>
                            {CATEGORIES.map((c) => (
                              <Checkbox
                                key={c}
                                label={t(`categories.${c}`)}
                                checked={categories.includes(c)}
                                onChange={() => toggle(setCategories)(c)}
                              />
                            ))}
                          </div>
                          <div className="dropdown-actions">
                            <Button variant="quiet" size="sm" onClick={() => setCategories([])}>{t('common.reset')}</Button>
                            <span className="spacer" />
                            <Button variant="primary" size="sm" onClick={close}>{t('common.apply')}</Button>
                          </div>
                        </>
                      )}
                    </FilterChip>

                    <FilterChip label={t('common.rating')} active={ratingKey !== 'all'}>
                      {({ close }) => (
                        <>
                          <p className="dropdown-title">{t('map.ratingMenuTitle')}</p>
                          <div style={{ padding: '0 var(--sp-3) var(--sp-2)' }}>
                            {Object.keys(RATING_LIMITS).map((k) => (
                              <Radio
                                key={k}
                                name="rating"
                                label={t(`map.ratingOptions.${k}`)}
                                checked={ratingKey === k}
                                onChange={() => { setRatingKey(k); close() }}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </FilterChip>

                    <Chip active={onlyVideos} onClick={() => setOnlyVideos((v) => !v)}>{t('common.onlyWithVideos')}</Chip>

                    <FilterChip label={t('common.price')} active={prices.length > 0} align="right">
                      {() => (
                        <>
                          <p className="dropdown-title">{t('map.priceMenuTitle')}</p>
                          <div className="row-wrap" style={{ padding: '0 var(--sp-3) var(--sp-3)' }}>
                            {PRICE_LEVELS.map((p) => (
                              <Chip key={p} active={prices.includes(p)} onClick={() => toggle(setPrices)(p)}>{p}</Chip>
                            ))}
                          </div>
                        </>
                      )}
                    </FilterChip>

                    {activeFilters > 0 && (
                      <Chip onClick={resetFilters}>{t('map.resetFilters')}</Chip>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Marker, Position aus den echten Koordinaten gerechnet */}
            {!loading && projizieren && list.map((p) => {
              const { top, left } = projizieren(p)
              return (
                <button
                  key={p.id}
                  type="button"
                  className="marker marker-ort"
                  data-selected={selected === p.id}
                  style={{ top, left }}
                  aria-label={p.name}
                  onClick={() => setSelected(selected === p.id ? null : p.id)}
                >
                  {/*
                    * Betriebe mit Videos sind größer und tragen die
                    * Akzentfarbe, sie sind der Grund, warum man hier ist.
                    * Der Rest steht in Grau daneben, ohne zu verschwinden.
                    */}
                  <span className={`marker-pin ${p.videoCount > 0 ? 'marker-pin-video' : ''}`}>
                    {p.videoCount > 0 && <SquarePlay size={15} />}
                  </span>
                </button>
              )
            })}

            {/* Eigener Standort */}
            <span className="marker map-me" style={{ top: '50%', left: '50%' }} aria-hidden="true" />

            {/*
              Die schwebenden Knöpfe stehen über dem Ergebnisblatt, sonst
              liegen sie darunter und lassen sich auf dem Handy nicht treffen.
            */}
            <div className="map-tools">
              {/* Der Wunsch: die Karte allein ansehen, ohne Leisten drumherum */}
              {isMobile && (
                <button
                  type="button"
                  className="btn btn-icon map-tool"
                  onClick={() => setPureMap(!pureMap)}
                  aria-pressed={pureMap}
                  aria-label={pureMap ? t('map.pureModeOff') : t('map.pureModeOn')}
                  title={pureMap ? t('map.pureModeOff') : t('map.pureModeOn')}
                >
                  {pureMap ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
              )}
              <button type="button" className="btn btn-icon map-tool" aria-label={t('map.centerOnMe')}>
                <Crosshair size={20} />
              </button>
            </div>

            <div className="map-attribution">{t('footer.mapData')}</div>

            {/* In der reinen Ansicht nur eine kleine Karte zum gewählten Marker */}
            {pureMap ? (
              selectedPlace && <MapPreview place={selectedPlace} onClose={() => setSelected(null)} />
            ) : (
              <div className="bottom-sheet">
                <div className="sheet-handle" />
                {selectedPlace ? (
                  <>
                    <MapPreview place={selectedPlace} onClose={() => setSelected(null)} inline />
                    <div className="list-group">{results}</div>
                  </>
                ) : results}
              </div>
            )}
          </div>
        </div>
      </div>
    </BarePage>
  )
}

/** Vorschaukarte zum angetippten Marker (Konzept 8.1). */
function MapPreview({ place, onClose, inline }) {
  return (
    <div className={`map-preview ${inline ? 'is-inline' : ''}`}>
      <IconButton icon={X} label={t('common.close')} className="map-preview-close" onClick={onClose} />
      <Link to={`/g/${place.slug}`} className="map-preview-body">
        <div className="row" style={{ gap: 6 }}>
          <span className="t-h3 truncate">{place.name}</span>
          {place.verified && <VerifiedMark />}
        </div>
        <ServingRow serving={place.serving} size="sm" max={6} />
        <p className="t-small c-secondary">
          {place.cuisine} · {place.price} · {formatDistance(place.distanceKm)}
          {place.videoCount > 0 && ` · ${place.videoCount} Videos`}
        </p>
        <RatingCompact rating={place.rating} average />
        <p className="t-small" style={{ color: place.open ? 'var(--success)' : 'var(--text-secondary)' }}>
          {openSentence(place)}
        </p>
      </Link>
    </div>
  )
}
