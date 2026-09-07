import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, ChevronLeft, Flame, Info, Printer, Search, Share2, Sparkles, UtensilsCrossed, X,
} from 'lucide-react'
import {
  Badge, Button, EmptyState, IconButton, LoadingBlock, ServingRow, Skeleton, Stars,
  VerifiedMark, useToast,
} from '../../design/ui'
import { useScreen } from '../../components/layout'
import { api, useQuery } from '../../lib/store'
import { openSentence } from '../../lib/hours-text'
import { useDesignState } from '../../lib/design-state'
import { ALLERGEN_KEYS } from '../../design/vocabulary'
import { t } from '../../design/i18n'

/**
 * Die reine Speisekarte — eigene Seite unter /g/[slug]/speisekarte.
 *
 * Bewusst ohne den Rahmen der App: keine untere Navigation, keine Fußzeile,
 * kein Feed. Wer im Lokal sitzt und den QR-Code scannt, will die Karte lesen
 * und sonst nichts. Aufbau wie eine gedruckte Karte, nur mit Sprungleiste,
 * Suche und Kennzeichnung.
 */
export default function MenuPage() {
  const { slug } = useParams()
  const { position } = useDesignState()
  const toast = useToast()

  const { data: place, loading: placeLoading } = useQuery(
    () => api.places.bySlug(slug, position), [slug, position],
  )
  const { data: categories, loading: menuLoading } = useQuery(
    () => (place ? api.menu.get(place.id) : Promise.resolve([])),
    [place?.id],
    { initial: [], enabled: !!place },
  )

  const [query, setQuery] = useState('')
  const [active, setActive] = useState(null)
  const sectionRefs = useRef({})

  useScreen(place ? `${t('menu.title')} — ${place.name}` : t('menu.title'))

  /* Suche filtert innerhalb der Kategorien, die Struktur bleibt erhalten. */
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return categories ?? []
    return (categories ?? [])
      .map((c) => ({ ...c, items: c.items.filter((d) => `${d.name} ${d.description}`.toLowerCase().includes(q)) }))
      .filter((c) => c.items.length > 0)
  }, [categories, query])

  const total = (categories ?? []).reduce((sum, c) => sum + c.items.length, 0)

  /* Welche Kategorie ist gerade im Blick? Danach richtet sich die Sprungleiste. */
  useEffect(() => {
    const nodes = Object.entries(sectionRefs.current).filter(([, el]) => el)
    if (nodes.length === 0) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible[0]) setActive(visible[0].target.dataset.category)
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 },
    )
    nodes.forEach(([, el]) => observer.observe(el))
    return () => observer.disconnect()
  }, [shown.length])

  const jumpTo = (id) => {
    const el = sectionRefs.current[id]
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 88
    window.scrollTo({ top, behavior: 'smooth' })
    setActive(id)
  }

  if (placeLoading) {
    return (
      <div className="menu-page">
        <div className="menu-head"><Skeleton w="60%" h={26} /><Skeleton w="40%" h={14} /></div>
        <LoadingBlock />
      </div>
    )
  }

  if (!place) {
    return (
      <div className="menu-page">
        <div className="container" style={{ paddingBlock: 'var(--sp-16)' }}>
          <EmptyState
            icon={UtensilsCrossed}
            title={t('place.notFoundTitle')}
            text={t('place.notFoundText')}
            action={<Button variant="primary" to="/karte">{t('map.title')}</Button>}
          />
        </div>
      </div>
    )
  }

  /* Nur die tatsächlich vorkommenden Allergene stehen später in der Legende. */
  const usedAllergens = ALLERGEN_KEYS.filter((key) =>
    (categories ?? []).some((c) => c.items.some((d) => d.allergens?.includes(key))))

  return (
    <div className="menu-page">
      <header className="menu-head">
        <div className="menu-head-inner">
          <Link to={`/g/${place.slug}`} className="menu-back">
            <ChevronLeft size={18} aria-hidden="true" />
            {t('menu.backToPlace', { name: place.name })}
          </Link>

          <div className="row-wrap" style={{ gap: 'var(--sp-2)', alignItems: 'center' }}>
            <h1 className="t-h1">{place.name}</h1>
            {place.verified && <VerifiedMark />}
          </div>

          <p className="t-small c-secondary">
            {place.tags.join(' · ')} · {place.price} · {place.address}, {place.city}
          </p>

          <ServingRow serving={place.serving} size="md" />

          <div className="row-wrap" style={{ gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
            <span className="t-small" style={{ color: place.open ? 'var(--success)' : 'var(--text-secondary)', fontWeight: 600 }}>
              {openSentence(place)}
            </span>
            {total > 0 && <span className="t-small c-tertiary">· {t('menu.itemCount', { count: total })}</span>}
          </div>
        </div>

        {/* Suche und Sprungleiste bleiben beim Scrollen stehen */}
        <div className="menu-sticky">
          <div className="menu-search">
            <Search size={18} className="search-icon" aria-hidden="true" />
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('menu.searchPlaceholder')}
              aria-label={t('menu.searchPlaceholder')}
            />
            {query && (
              <button type="button" className="menu-search-clear" onClick={() => setQuery('')} aria-label={t('common.clear')}>
                <X size={16} />
              </button>
            )}
          </div>

          {shown.length > 1 && (
            <nav className="menu-jump" aria-label={t('menu.jumpTo')}>
              {shown.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="chip"
                  aria-pressed={active === c.id}
                  onClick={() => jumpTo(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main className="menu-body">
        {menuLoading ? (
          <LoadingBlock />
        ) : total === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title={t('menu.emptyTitle')}
            text={t('menu.emptyText')}
            action={<Button variant="secondary" to={`/g/${place.slug}`}>{t('common.back')}</Button>}
          />
        ) : shown.length === 0 ? (
          <EmptyState icon={Search} title={t('menu.emptySearch', { query })} action={<Button variant="secondary" onClick={() => setQuery('')}>{t('common.reset')}</Button>} />
        ) : (
          shown.map((category) => (
            <section
              key={category.id}
              className="menu-section"
              data-category={category.id}
              ref={(el) => { sectionRefs.current[category.id] = el }}
            >
              <h2 className="t-h2 menu-section-title">{category.name}</h2>
              {category.description && <p className="t-small c-secondary">{category.description}</p>}

              <ul className="menu-list">
                {category.items.map((dish) => <DishRow key={dish.id} dish={dish} />)}
              </ul>
            </section>
          ))
        )}

        {total > 0 && (
          <footer className="menu-foot">
            {usedAllergens.length > 0 && (
              <section>
                <h3 className="t-h3">{t('allergens.label')}</h3>
                <p className="t-small c-secondary">{t('allergens.hint')}</p>
                <ol className="menu-legend">
                  {usedAllergens.map((key) => (
                    <li key={key} className="t-small c-secondary">
                      <span className="menu-allergen-no">{ALLERGEN_KEYS.indexOf(key) + 1}</span>
                      {t(`allergens.${key}`)}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {place.menuNote && <p className="t-small c-secondary">{place.menuNote}</p>}
            <p className="t-small c-tertiary">{t('menu.updatedHint')}</p>

            <div className="row-wrap menu-foot-actions">
              <Button variant="secondary" icon={ArrowLeft} to={`/g/${place.slug}`}>{t('common.back')}</Button>
              <Button variant="secondary" icon={Share2} onClick={() => toast(t('toast.linkCopied'))}>{t('menu.share')}</Button>
              <Button variant="quiet" icon={Printer} onClick={() => window.print()}>{t('menu.print')}</Button>
            </div>
          </footer>
        )}
      </main>
    </div>
  )
}

/** Eine Zeile der Karte: Name, Beschreibung, Kennzeichnung, Preis. */
function DishRow({ dish }) {
  const price = (dish.priceCents / 100).toFixed(2).replace('.', ',')
  const numbers = (dish.allergens ?? []).map((key) => ALLERGEN_KEYS.indexOf(key) + 1).sort((a, b) => a - b)

  return (
    <li className={`menu-item ${dish.available === false ? 'is-unavailable' : ''}`}>
      <div className="menu-item-main">
        <p className="menu-item-name">
          {dish.name}
          {numbers.length > 0 && (
            <sup className="menu-item-allergens" title={t('allergens.label')}>{numbers.join(',')}</sup>
          )}
        </p>

        {dish.description && <p className="t-small c-secondary">{dish.description}</p>}

        <div className="row-wrap menu-item-marks">
          {(dish.diet ?? []).map((key) => <Badge key={key} tone="success">{t(`diet.${key}`)}</Badge>)}
          {dish.spicy > 0 && (
            <Badge tone="warning" icon={Flame}>
              <span className="sr-only">{t('menu.spicyLevel', { level: dish.spicy })}</span>
              <span aria-hidden="true">{'·'.repeat(dish.spicy)}</span>
            </Badge>
          )}
          {dish.popular && <Badge tone="accent" icon={Sparkles}>{t('menu.popular')}</Badge>}
          {dish.available === false && <Badge tone="danger">{t('menu.soldOut')}</Badge>}
        </div>

        {dish.ratingCount > 0 && (
          <p className="t-small c-secondary row" style={{ gap: 4 }}>
            <Stars value={dish.rating} size={12} />
            {dish.rating.toFixed(1).replace('.', ',')}
            <span className="c-tertiary">({t('menu.ratingCount', { count: dish.ratingCount })})</span>
          </p>
        )}
      </div>

      <p className="menu-item-price">{price} €</p>
    </li>
  )
}
