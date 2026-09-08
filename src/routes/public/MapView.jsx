import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft, Crosshair, Maximize2, Minimize2, Minus, Plus, Search, SquarePlay, UtensilsCrossed, X,
} from 'lucide-react'
import { Button, Chip, FilterChip, SkeletonRow, EmptyState, Checkbox, Radio, IconButton, ServingPicker, ServingRow, Spinner, RatingCompact, VerifiedMark,  } from '../../design/ui'
import { PlaceRow } from '../../components/PlaceRowConnected'
import { BarePage } from '../../components/layout'
import { useDesignState } from '../../lib/design-state'
import { api, formatDistance, useQuery } from '../../lib/store'
import { useToast } from '../../design/ui'
import { MapTiles } from '../../components/MapTiles'
import { useKartenGesten } from '../../lib/karten-gesten'
import { useKartenblick } from '../../lib/karten-blick'
import { zoomBegrenzen } from '../../lib/map'
import { openSentence } from '../../lib/hours-text'
import { RADIUS_OPTIONS, PRICE_LEVELS } from '../../design/config'
import { SERVING_KEYS } from '../../design/vocabulary'
import { t } from '../../design/i18n'

/*
 * Die Kategorien, die es im Bestand wirklich gibt.
 *
 * Sie stehen genauso in tools/osm-import.mjs (KATEGORIE). Wer hier eine
 * hinzufügt, die der Import nie vergibt, baut einen Filter, der auf nichts
 * zeigt. „Sonstiges" fehlte umgekehrt: Metzgereien und Feinkost landen dort,
 * und ohne den Eintrag ließen sie sich nicht auswählen.
 */
const CATEGORIES = ['restaurant', 'cafe', 'imbiss', 'baeckerei', 'eisdiele', 'bar', 'pub', 'sonstiges']
const RATING_LIMITS = { all: 0, from3: 3, from4: 4, from45: 4.5 }

/**
 * Wie weit reicht der Kartenausschnitt bei diesem Umkreis? Etwas mehr als der
 * Umkreis selbst, damit die Marker am Rand nicht abgeschnitten wirken, aber
 * nicht zu viel, sonst klumpen sie in der Mitte.
 */
const spanFor = (radiusKm) => Math.max(2, radiusKm * 1.6)

/** Wie viele Marker die Karte höchstens auf einmal zeigt. */
const MARKER_GRENZE = 200

/** Zwei Ausschnitte gelten als gleich, wenn sie sich kaum unterscheiden. */
const gleicheGrenzen = (a, b) => a && b
  && Math.abs(a.nord - b.nord) < 1e-4 && Math.abs(a.sued - b.sued) < 1e-4
  && Math.abs(a.west - b.west) < 1e-4 && Math.abs(a.ost - b.ost) < 1e-4

/** C.2, Kartenansicht */
export default function MapView() {
  const {
    position, radiusKm, setRadiusKm, pureMap, setPureMap, isMobile,
    standortAktualisieren, standortLaeuft,
  } = useDesignState()
  const toast = useToast()

  /*
   * ┌─ Wie die Karte ihren Ausschnitt hält ──────────────────────────────────┐
   * │  mitte      wo die Karte steht, wandert beim Schieben                  │
   * │  zoom       gebrochene Zoomstufe, `null` heißt „aus dem Umkreis"       │
   * │  blickRef   die letzte Rechnung, die der Kartenschirm gemeldet hat     │
   * │  grenzen    derselbe Ausschnitt als Rechteck, für die Abfrage          │
   * └────────────────────────────────────────────────────────────────────────┘
   *
   * Vorher stand die Karte fest auf der eigenen Position und zeigte den
   * eingestellten Umkreis. Man konnte sie ansehen, aber nicht benutzen.
   * Jetzt ist sie eine Karte: schieben, zoomen, und geladen wird, was im
   * Bild liegt.
   */
  const [mitte, setMitte] = useState(position)
  const [zoom, setZoom] = useState(null)
  const [grenzen, setGrenzen] = useState(null)
  const [selbstBewegt, setSelbstBewegt] = useState(false)
  const blickRef = useRef(null)
  /* Gemessen wird der ganze Schirm, gegriffen nur die Ebene darüber. */
  const schirm = useRef(null)
  const gesten = useRef(null)

  /* Solange niemand die Karte angefasst hat, folgt sie dem eigenen Standort. */
  useEffect(() => {
    if (!selbstBewegt) setMitte(position)
  }, [position, selbstBewegt])

  /*
   * Solange niemand gezoomt hat, sagt der eingestellte Umkreis, wie weit die
   * Karte reicht. Danach führt die Zoomstufe.
   */
  const blick = useKartenblick(schirm, {
    center: mitte,
    spanKm: zoom == null ? spanFor(radiusKm) : undefined,
    zoom: zoom ?? undefined,
  })
  blickRef.current = blick

  /*
   * Was im Bild liegt, geht als Rechteck in die Abfrage. Der Vergleich ist
   * nötig, weil bei jedem Bild eine neue Rechnung entsteht: Ohne ihn würde
   * jede Bewegung eine neue Abfrage auslösen, auch wenn sich nichts ändert.
   */
  useEffect(() => {
    if (blick) setGrenzen((alt) => (gleicheGrenzen(alt, blick.grenzen) ? alt : blick.grenzen))
  }, [blick])

  const aendern = useCallback(({ center, zoom: neuerZoom }) => {
    setSelbstBewegt(true)
    setMitte(center)
    setZoom(zoomBegrenzen(neuerZoom))
  }, [])

  /*
   * Die Zuhörer hängen an der Gestenebene und nicht am ganzen Schirm.
   *
   * Warum das wichtig ist: Am Schirm fingen sie auch die Knöpfe ab, die
   * darauf liegen. `setPointerCapture` zieht alle weiteren Berichte zum
   * greifenden Element, und damit kam auf dem Knopf nie ein Klick an. Die
   * Zoomknöpfe und der Standortknopf sahen aus wie tot, obwohl sie
   * verdrahtet waren.
   */
  useKartenGesten(gesten, blickRef, aendern)

  /** Zoomknöpfe: dieselbe Bewegung, nur ohne Finger. */
  const zoomStufe = (stufen) => {
    if (!blickRef.current) return
    setSelbstBewegt(true)
    setZoom(zoomBegrenzen(blickRef.current.genauerZoom + stufen))
  }

  /**
   * Zurück zum Umkreis.
   *
   * Wer im Menü „10 km" wählt, meint den Ausschnitt und nicht einen Filter.
   * `zoom = null` gibt die Führung wieder an den Umkreis ab, und die nächste
   * Rechnung stellt die passende Stufe ein.
   */
  const rahmenNeu = () => {
    setSelbstBewegt(false)
    setZoom(null)
  }

  /** Der Knopf mit dem Fadenkreuz. */
  const zuMir = async () => {
    const ergebnis = await standortAktualisieren()
    if (!ergebnis.ok) return toast(t(`map.locate.${ergebnis.grund}`), 'error')
    setSelbstBewegt(false)
    setMitte(ergebnis.ort)
    setZoom(15)
    return undefined
  }

  const [query, setQuery] = useState('')
  const [openNow, setOpenNow] = useState(false)
  const [onlyVideos, setOnlyVideos] = useState(false)
  const [categories, setCategories] = useState([])
  const [serving, setServing] = useState([])
  const [prices, setPrices] = useState([])
  const [ratingKey, setRatingKey] = useState('all')
  const [selected, setSelected] = useState(null)

  /*
   * ┌─ Was geladen wird ─────────────────────────────────────────────────────┐
   * │  bounds    der sichtbare Ausschnitt, nicht mehr der feste Umkreis      │
   * │  position  die Kartenmitte, damit die Entfernungen von dort zählen     │
   * │  limit     eine Obergrenze, sonst zeigt Berlin auf Stufe 12 tausend    │
   * │            Marker auf einmal                                           │
   * └────────────────────────────────────────────────────────────────────────┘
   *
   * Genau das war der Wunsch: wie bei Maps, es lädt, was man ansieht. Der
   * Server bekommt dasselbe Rechteck und filtert schon dort vor, bevor er
   * Entfernungen und Öffnungszeiten rechnet (Server/src/domain/places.js).
   */
  const filters = useMemo(() => ({
    position: mitte, bounds: grenzen, limit: MARKER_GRENZE,
    query, openNow, onlyVideos, categories, serving, prices,
    minRating: RATING_LIMITS[ratingKey],
  }), [mitte, grenzen, query, openNow, onlyVideos, categories, serving, prices, ratingKey])

  const { data, loading, refreshing } = useQuery(
    () => (grenzen ? api.places.list(filters) : Promise.resolve([])),
    [JSON.stringify(filters)],
    { initial: [] },
  )
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
          : <Button variant="secondary" onClick={() => { setRadiusKm(25); rahmenNeu() }}>{t('map.emptyCta')}</Button>
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

          <div className="map-canvas" ref={schirm}>
            <MapTiles blick={blick} />

            {/*
              * Die Ebene, die Finger und Maus entgegennimmt. Sie liegt über
              * den Kacheln und unter allem, was man antippen können muss:
              * Marker, Leisten, Blatt. So schiebt ein Wisch die Karte, ein
              * Tipp auf einen Marker aber öffnet den Betrieb.
              */}
            <div className="map-gesten" ref={gesten} />
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
                            <button
                              key={r}
                              type="button"
                              className="menu-item"
                              onClick={() => { setRadiusKm(r); rahmenNeu(); close() }}
                            >
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

            {/*
              * Marker, Position aus den echten Koordinaten gerechnet.
              * Die Ebene darum beschneidet, was über den Rand ragt.
              */}
            <div className="map-marker-ebene">
            {blick && list.map((p) => {
              const { top, left } = blick.projizieren(p)
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

            {/*
              * Eigener Standort. Vorher saß der Punkt fest in der Bildmitte,
              * weil die Karte immer auf ihm stand. Seit man sie schieben kann,
              * muss er dorthin, wo man wirklich ist.
              */}
            {blick && (() => {
              const { top, left } = blick.projizieren(position)
              const drin = left >= 0 && top >= 0
              return drin ? <span className="marker map-me" style={{ top, left }} aria-hidden="true" /> : null
            })()}
            </div>

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
              <button
                type="button"
                className="btn btn-icon map-tool"
                onClick={() => zoomStufe(1)}
                aria-label={t('map.zoomIn')}
                title={t('map.zoomIn')}
              >
                <Plus size={20} />
              </button>
              <button
                type="button"
                className="btn btn-icon map-tool"
                onClick={() => zoomStufe(-1)}
                aria-label={t('map.zoomOut')}
                title={t('map.zoomOut')}
              >
                <Minus size={20} />
              </button>

              {/*
                * Der Knopf tat vorher nichts. Jetzt fragt er das Gerät nach
                * dem Standort, und wenn das nicht geht, sagt er warum.
                */}
              <button
                type="button"
                className="btn btn-icon map-tool"
                onClick={zuMir}
                disabled={standortLaeuft}
                aria-label={t('map.centerOnMe')}
                title={t('map.centerOnMe')}
              >
                <Crosshair size={20} className={standortLaeuft ? 'spin' : undefined} />
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
