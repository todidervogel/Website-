import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Search, UtensilsCrossed, X } from 'lucide-react'
import { Button, Notice, ServingRow, SkeletonRow, Thumb } from '../../design/ui'
import { Page } from '../../components/layout'
import { MissingPlaceDialog } from '../dialogs/MissingPlaceDialog'
import { useDesignState, useVariant } from '../../lib/design-state'
import { useUpload } from '../../lib/upload'
import { api, useQuery } from '../../lib/store'
import { t } from '../../design/i18n'

/** Unter 150 m gilt das Video als „vor Ort" verifiziert (Konzept 8.5). */
const ON_SITE_KM = 0.15

/** E.3 — Restaurant auswählen, Schritt 3 */
export default function UploadPlace() {
  const { position } = useDesignState()
  const { draft, save } = useUpload()
  const [query, setQuery] = useState('')
  const [missingOpen, setMissingOpen] = useState(false)
  const navigate = useNavigate()

  const { data, loading } = useVariant(
    useQuery(() => api.places.nearby(position, 20), [position], { initial: [] }),
  )

  const list = useMemo(() => {
    const all = data ?? []
    const q = query.trim().toLowerCase()
    if (!q) return all.slice(0, 8)
    return all.filter((p) => `${p.name} ${p.cuisine} ${p.address}`.toLowerCase().includes(q))
  }, [data, query])

  const selected = draft.placeId
  const selectedPlace = (data ?? []).find((p) => p.id === selected)

  /* Die Ortsprüfung hängt am gewählten Betrieb — sie wird hier festgehalten. */
  useEffect(() => {
    if (!selectedPlace) return
    const onSite = (selectedPlace.distanceKm ?? 99) <= ON_SITE_KM
    if (draft.verifiedOnSite !== onSite) save({ verifiedOnSite: onSite })
  }, [selectedPlace?.id, selectedPlace?.distanceKm])

  return (
    <Page title={t('upload.place.title')} footer={false}>
      <div style={{ paddingBlock: 'var(--sp-6) 120px' }} className="stack-4">
        <div>
          <p className="t-small c-secondary">{t('upload.steps', { current: 3, total: 5 })}</p>
          <h1 className="t-h1">{t('upload.place.title')}</h1>
          <p className="t-body c-secondary" style={{ marginTop: 'var(--sp-2)' }}>{t('upload.place.subtitle')}</p>
        </div>

        <div className="header-search" style={{ maxWidth: 'none' }}>
          <Search size={18} className="search-icon" />
          <input
            className="input"
            style={{ height: 44 }}
            placeholder={t('upload.place.searchPlaceholder')}
            aria-label={t('common.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button type="button" className="menu-search-clear" onClick={() => setQuery('')} aria-label={t('common.clear')}>
              <X size={16} />
            </button>
          )}
        </div>

        <h2 className="t-small c-secondary">{query ? t('common.search') : t('upload.place.nearby')}</h2>

        <div className="list-group">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            : list.map((p) => (
              <div key={p.id}>
                <label className="list-row" style={selected === p.id ? { background: 'var(--accent-soft)' } : undefined}>
                  <Thumb size={48} icon={UtensilsCrossed} />
                  <span className="grow">
                    <span className="t-h3" style={{ display: 'block' }}>{p.name}</span>
                    <span className="t-small c-secondary">{p.cuisine} · {p.distance}</span>
                    <ServingRow serving={p.serving} size="sm" max={5} />
                  </span>
                  <input
                    type="radio"
                    name="place"
                    checked={selected === p.id}
                    onChange={() => save({ placeId: p.id })}
                    style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
                  />
                </label>
                {selected === p.id && (p.distanceKm ?? 99) <= ON_SITE_KM && (
                  <div style={{ padding: '0 var(--sp-4) var(--sp-3)' }}>
                    <Notice tone="success" icon={Check}>{t('upload.place.onSiteNotice')}</Notice>
                  </div>
                )}
              </div>
            ))}

          {!loading && list.length === 0 && (
            <p className="t-body c-secondary" style={{ padding: 'var(--sp-4)' }}>{t('common.noResults')}</p>
          )}
        </div>

        <Button variant="quiet" onClick={() => setMissingOpen(true)}>{t('upload.place.missing')}</Button>
      </div>

      <div className="action-bar" style={{ position: 'fixed', bottom: 68, left: 0, right: 0, padding: 'var(--sp-3) var(--gutter)', gridAutoFlow: 'row' }}>
        <Button
          variant="primary"
          full
          disabled={!selected}
          onClick={() => navigate('/upload/bewertung')}
        >
          {t('common.next')}
        </Button>
      </div>

      <MissingPlaceDialog open={missingOpen} onClose={() => setMissingOpen(false)} />
    </Page>
  )
}
