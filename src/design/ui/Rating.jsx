import { Star } from 'lucide-react'
import { t } from '../i18n'

/** TEIL A.6 — Immer 5 Sterne. */
export function Stars({ value = 0, size = 14 }) {
  return (
    <span className="stars" aria-label={`${value} von 5 Sternen`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.floor(value) ? 'star-filled' : 'star-empty'}
          strokeWidth={0}
        />
      ))}
    </span>
  )
}

/**
 * Mittelwerte werden immer mit einer Nachkommastelle gezeigt (4,0),
 * einzelne Bewertungen als ganze Zahl (4) — so steht es in A.6 bzw. C.6.
 */
const fmt = (n, average) =>
  average || !Number.isInteger(n) ? n.toFixed(1).replace('.', ',') : String(n)

/**
 * TEIL A.6 — Kompaktform für Listen.
 * Die drei Kategorien werden nie zu einer Zahl zusammengefasst.
 */
export function RatingCompact({ rating, onDark, average }) {
  if (!rating) return <span className={`t-small ${onDark ? 'c-on-dark-dim' : 'c-tertiary'}`}>{t('rating.none')}</span>
  const items = [
    [t('rating.food'), rating.food],
    [t('rating.service'), rating.service],
    [t('rating.price'), rating.price],
  ]
  /*
   * Kein Trennpunkt zwischen den Werten. In einer schmalen Liste bricht die
   * Zeile nach dem zweiten Wert um, und der Punkt bleibt allein am Zeilenende
   * stehen — „4,0 Service ·“. Der Abstand trennt genauso gut und kann nicht
   * hängen bleiben.
   */
  return (
    <span className={`rating-compact ${onDark ? 'c-on-dark' : ''}`}>
      {items.map(([label, value]) => (
        <span key={label} className="rating-item">
          <Star size={12} className="star-filled" strokeWidth={0} style={{ display: 'inline', verticalAlign: '-1px' }} />
          {' '}{fmt(value, average)} {label}
        </span>
      ))}
    </span>
  )
}

/** TEIL A.6 — Vollform: Label links, Sterne mittig, Zahl rechts. */
export function RatingFull({ rating, count }) {
  if (!rating) return <p className="t-body c-tertiary">{t('rating.none')}</p>
  const rows = [
    [t('rating.food'), rating.food],
    [t('rating.service'), rating.service],
    [t('rating.price'), rating.price],
  ]
  return (
    <div>
      <div className="rating-full">
        {rows.map(([label, value]) => (
          <Row key={label} label={label} value={value} />
        ))}
      </div>
      {count != null && <p className="t-small c-secondary" style={{ marginTop: 'var(--sp-2)' }}>{t('rating.fromCount', { count })}</p>}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <>
      <span className="t-body">{label}</span>
      <Stars value={value} size={16} />
      <span className="t-body-bold">{fmt(value, true)}</span>
    </>
  )
}

/** Antippbare Sterne für die Bewertung (E.5). */
export function StarInput({ value = 0, onChange, label, compact }) {
  return (
    <div className={`star-input ${compact ? 'star-input-compact' : ''}`} role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} von 5`}
          onClick={() => onChange?.(i)}
        >
          <Star size={compact ? 20 : 26} className={i <= value ? 'star-filled' : 'star-empty'} strokeWidth={0} />
        </button>
      ))}
    </div>
  )
}

export function ratingLabel(value) {
  return value ? t(`rating.scale.${value}`) : null
}
