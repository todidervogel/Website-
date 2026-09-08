import { useRef, useState } from 'react'
import { ChevronRight, Compass, Info, MapPin, Navigation, QrCode, SquarePlay, UtensilsCrossed } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, IconButton, ServingRow, Skeleton, VideoTile } from '../../design/ui'
import { Page } from '../../components/layout'
import { useDesignState } from '../../lib/design-state'
import { api, useQuery } from '../../lib/store'
import { MapTiles } from '../../components/MapTiles'
import { useKartenblick } from '../../lib/karten-blick'
import { t } from '../../design/i18n'

/**
 * C.1. Die Seite vor der Anwendung.
 *
 * Das ist keine Startseite der App, sondern eine Präsentationsseite: Wer hier
 * ankommt, kennt das Produkt noch nicht. Deshalb ohne Seitenleiste und ohne
 * untere Leiste, die gehören in die Anwendung, nicht davor. Von hier führen
 * Knöpfe hinein.
 *
 * **Sie erscheint nur für Besucher ohne Konto, und nur im Browser.** Wer
 * angemeldet ist, kommt unter `/` direkt in den Feed; in der App gibt es sie
 * gar nicht. Genau so hält es Instagram: Wer eingeloggt ist, will seinen Feed
 * sehen und keine Broschüre.
 *
 * Der Aufbau folgt dem, was solche Seiten üblicherweise leisten müssen:
 * behaupten (Kopfbereich), zeigen (echte Daten statt Bildern), erklären
 * (drei Merkmale), die zweite Zielgruppe abholen (Gastronomie), abschließen.
 */
export default function Landing() {
  const { position, radiusKm, setPosition } = useDesignState()
  const navigate = useNavigate()
  const [where, setWhere] = useState('')
  const kartenkasten = useRef(null)
  /* Eine kleine Karte, sechs Kilometer breit, ohne Bedienung. */
  const blick = useKartenblick(kartenkasten, { center: position, spanKm: 6 })

  const { data: feed, loading: feedLoading } = 
    useQuery(() => api.videos.feed({ position, radiusKm: Math.max(radiusKm, 10) }), [position, radiusKm], {
      initial: { items: [] },
    })
  const { data: nearby, loading: mapLoading } = 
    useQuery(() => api.places.nearby(position, 12), [position], { initial: [] })

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
    <Page title={t('home.title')} bottomNav={false}>
      {/* --- Behaupten --------------------------------------------------- */}
      <section className="lp-hero">
       <div className="lp-hero-grid">
        <div className="lp-hero-text">
        <span className="lp-eyebrow">{t('landing.eyebrow')}</span>
        <h1 className="lp-title">{t('landing.title')}</h1>
        <p className="lp-lead">{t('landing.lead')}</p>

        <form className="row-wrap" style={{ marginTop: 'var(--sp-6)', gap: 'var(--sp-2)', maxWidth: 560 }} onSubmit={goToPlace}>
          <div className="input-affix grow" style={{ minWidth: 240 }}>
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

        {/*
          * „Losgehen“ führt schon zur Karte, ein zweiter Knopf daneben, der
          * dasselbe tut, macht die Entscheidung nur schwerer. Übrig bleibt der
          * Weg für die andere Zielgruppe.
          */}
        <p className="t-body" style={{ marginTop: 'var(--sp-4)' }}>
          <Link to="/fuer-gastronomen" className="c-accent">{t('landing.gastroMore')}</Link>
        </p>
        </div>

        {/*
          * Rechts keine Bühnengrafik, sondern die Karte mit echten Betrieben.
          * Auf dem Handy fällt sie unter den Text.
          */}
        <div className="lp-hero-map map-canvas" ref={kartenkasten}>
          <MapTiles blick={blick} />
          {!mapLoading && blick && markers.map((p) => (
            <span key={p.id} className="marker marker-ort" style={{ top: blick.projizieren(p).top, left: blick.projizieren(p).left }}>
              {/* Dieselbe Kartennadel wie auf der Karte selbst. */}
              <span className={`marker-pin ${p.videoCount > 0 ? 'marker-pin-video' : ''}`}>
                {p.videoCount > 0 && <SquarePlay size={15} />}
              </span>
            </span>
          ))}
        </div>
       </div>
      </section>

      {/* --- Zeigen: echte Videos, keine Bühnenbilder --------------------- */}
      <section className="lp-section">
        <div className="lp-section-head">
          <h2>{t('landing.videoTitle')}</h2>
          <p>{t('landing.videoLead')}</p>
        </div>

        <div className="video-grid">
          {feedLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={220} radius="var(--r-card)" />)
            : tiles.map((v) => (
              <VideoTile
                key={v.id}
                video={v}
                onClick={() => navigate(`/v/${v.id}`)}
              />
            ))}
        </div>

      </section>

      {/* --- Zeigen: das Unterscheidungsmerkmal --------------------------- */}
      <section className="lp-section">
        <div className="lp-section-head">
          <h2>{t('landing.servingTitle')}</h2>
          <p>{t('landing.servingLead')}</p>
        </div>
        {/*
          * Nicht als Bild erklärt, sondern mit dem Baustein selbst. Was hier
          * steht, steht später genauso an jedem Betrieb.
          */}
        <div className="card" style={{ padding: 'var(--sp-6)', display: 'grid', gap: 'var(--sp-4)' }}>
          {[
            ['Trattoria Bella', ['fleisch', 'fisch', 'vegetarisch', 'suesses']],
            ['Grünkern', ['vegan', 'vegetarisch', 'glutenfrei']],
            ['Bar Nordlicht', ['getraenke']],
          ].map(([name, serving]) => (
            <div key={name} className="row-between" style={{ gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
              <span className="t-h3">{name}</span>
              <ServingRow serving={serving} size="md" />
            </div>
          ))}
        </div>
      </section>

      {/* --- Erklären ---------------------------------------------------- */}
      <section className="lp-section">
        <div className="lp-section-head">
          <h2>{t('landing.featuresTitle')}</h2>
        </div>
        <div className="lp-grid">
          {[
            [Compass, 'discoverTitle', 'discoverText'],
            [Info, 'informTitle', 'informText'],
            [Navigation, 'goTitle', 'goText'],
          ].map(([Icon, titleKey, textKey]) => (
            <div key={titleKey} className="lp-feature">
              <span className="lp-feature-icon"><Icon size={22} /></span>
              <h3 className="t-h3">{t(`home.how.${titleKey}`)}</h3>
              <p className="t-body">{t(`home.how.${textKey}`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- Die zweite Zielgruppe --------------------------------------- */}
      <section className="lp-section">
        <div className="lp-grid" style={{ alignItems: 'center' }}>
          <div>
            <h2 className="t-h2">{t('landing.gastroTitle')}</h2>
            <p className="t-body c-secondary" style={{ marginTop: 'var(--sp-2)' }}>{t('landing.gastroLead')}</p>
            <div className="lp-cta">
              <Button variant="primary" to="/gastro/eintragen">{t('landing.gastroCta')}</Button>
              <Button variant="secondary" to="/fuer-gastronomen">{t('landing.gastroMore')}</Button>
            </div>
          </div>
          <div className="card" style={{ padding: 'var(--sp-6)' }}>
            <span className="lp-feature-icon"><QrCode size={22} /></span>
            <h3 className="t-h3" style={{ marginTop: 'var(--sp-3)' }}>{t('landing.menuTitle')}</h3>
            <p className="t-body c-secondary" style={{ marginTop: 'var(--sp-1)' }}>{t('landing.menuLead')}</p>
            <Link
              to="/g/trattoria-bella/speisekarte"
              className="row c-accent"
              style={{ marginTop: 'var(--sp-4)', textDecoration: 'none', gap: 4 }}
            >
              {t('menu.title')} <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* --- Abschließen -------------------------------------------------- */}
      <section className="lp-close">
        <h2>{t('landing.closeTitle')}</h2>
        <p>{t('landing.closeLead')}</p>
        <div className="lp-cta">
          <Button variant="primary" to="/karte">{t('landing.closeCta')}</Button>
          <Button variant="secondary" to="/registrieren">{t('landing.closeSecondary')}</Button>
        </div>
      </section>
    </Page>
  )
}
