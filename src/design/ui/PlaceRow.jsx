import { Link } from 'react-router-dom'
import { Bookmark, Play, UtensilsCrossed } from 'lucide-react'
import { Badge, Thumb, VerifiedMark } from './Primitives'
import { IconButton } from './Button'
import { RatingCompact } from './Rating'
import { ServingRow } from './Serving'
import { t } from '../i18n'

/**
 * Betriebszeile — Ergebnisliste Karte (C.2), Suche (C.5), Videodetail (C.7).
 *
 * Reihenfolge der Zeilen: Name · Angebot · Kategorie/Preis/Entfernung ·
 * Sterne · Öffnungsstatus. Das Angebot steht bewusst direkt unter dem Namen —
 * ob ein Laden nur Getränke hat oder auch vegan kocht, soll man sehen, bevor
 * man liest.
 *
 * Diese Zeile kennt weder Daten noch Anmeldung. Ob gespeichert ist und was
 * beim Tippen passieren soll, gibt die Anwendung mit.
 */
export function PlaceRow({ place, showSave = true, compact, saved, onToggleSave, openText }) {
  return (
    <div className="place-row">
      <Link to={`/g/${place.slug}`} className="place-thumb-wrap" aria-hidden="true" tabIndex={-1}>
        <Thumb size={compact ? 56 : 72} icon={UtensilsCrossed} />
        {place.videoCount > 0 && (
          <span className="place-video-badge">
            <Badge tone="dark" icon={Play}>{place.videoCount}</Badge>
          </span>
        )}
      </Link>

      <div className="grow">
        <Link to={`/g/${place.slug}`} className="row" style={{ gap: 6, textDecoration: 'none' }}>
          <span className="t-h3 truncate">{place.name}</span>
          {place.verified && <VerifiedMark />}
        </Link>

        <ServingRow serving={place.serving} size="sm" max={compact ? 4 : 6} className="place-serving" />

        <p className="t-small c-secondary">
          {place.cuisine} · {place.price}
          {place.distance ? ` · ${place.distance}` : ''}
        </p>

        <div style={{ marginTop: 2 }}><RatingCompact rating={place.rating} average /></div>

        {openText && (
          <p className="t-small" style={{ marginTop: 2, color: place.open ? 'var(--success)' : 'var(--text-secondary)' }}>
            {openText}
          </p>
        )}
      </div>

      {showSave && onToggleSave && (
        <IconButton
          icon={Bookmark}
          label={t('map.save')}
          className={saved ? 'is-active' : ''}
          onClick={onToggleSave}
        />
      )}
    </div>
  )
}

/** Kompakte, nicht klickbare Variante für Zusammenfassungen. */
export function PlaceSummary({ place, right, openText }) {
  return (
    <div className="row" style={{ gap: 'var(--sp-3)' }}>
      <Thumb size={40} icon={UtensilsCrossed} />
      <div className="grow">
        <div className="row" style={{ gap: 4 }}>
          <span className="t-body-bold truncate">{place.name}</span>
          {place.verified && <VerifiedMark />}
        </div>
        <p className="t-small c-secondary truncate">
          {place.cuisine}
          {place.distance ? ` · ${place.distance}` : ''}
          {openText ? ` · ${openText}` : ''}
        </p>
      </div>
      {right}
    </div>
  )
}
