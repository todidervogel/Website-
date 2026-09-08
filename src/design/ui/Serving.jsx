import {
  Cake, Croissant, CupSoda, Drumstick, Fish, LeafyGreen, Shell, Sprout, WheatOff,
} from 'lucide-react'
import { SERVING_KEYS } from '../vocabulary'
import { t } from '../i18n'

/**
 * Angebotsarten.
 *
 * Der Wunsch dahinter: auf den ersten Blick erkennen, was es hier gibt,
 * nur Getränke, vegan, Fleisch, Fisch, Meeresfrüchte. Deshalb steht die Zeile
 * weit oben und besteht aus Symbolen mit Beschriftung, nicht aus Fließtext.
 */
export const SERVING_ICONS = {
  getraenke: CupSoda,
  fruehstueck: Croissant,
  vegan: Sprout,
  vegetarisch: LeafyGreen,
  /* Keulchen statt Fleischstück, bei 13 px eindeutig lesbar. */
  fleisch: Drumstick,
  fisch: Fish,
  meeresfruechte: Shell,
  suess: Cake,
  halal: () => null,
  glutenfrei: WheatOff,
}

/** Reihenfolge der Anzeige, das Aussagekräftigste zuerst. */
const ORDER = ['getraenke', 'fleisch', 'fisch', 'meeresfruechte', 'vegan', 'vegetarisch', 'suess', 'fruehstueck', 'halal', 'glutenfrei']

export const sortServing = (list = []) =>
  [...list].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))

/** Ein Betrieb, der ausschließlich Getränke führt, sagt genau das. */
export const isDrinksOnly = (list = []) => list.length === 1 && list[0] === 'getraenke'

/**
 * Symbolzeile. `size="sm"` zeigt nur Symbole (Trefferlisten),
 * `size="md"` Symbol und Wort (Gastro-Seite).
 */
export function ServingRow({ serving = [], size = 'sm', max, className = '' }) {
  const list = sortServing(serving)
  if (list.length === 0) return null

  if (isDrinksOnly(list) && size !== 'sm') {
    return (
      <span className={`serving-row ${className}`}>
        <span className="serving-chip serving-strong">
          <CupSoda size={16} aria-hidden="true" />
          {t('serving.onlyDrinks')}
        </span>
      </span>
    )
  }

  const shown = max ? list.slice(0, max) : list
  const rest = list.length - shown.length

  return (
    <span className={`serving-row serving-${size} ${className}`} aria-label={`${t('serving.label')}: ${list.map((k) => t(`serving.${k}`)).join(', ')}`}>
      {shown.map((key) => {
        const Icon = SERVING_ICONS[key]
        return (
          <span key={key} className="serving-chip" title={t(`serving.${key}`)}>
            {Icon ? <Icon size={size === 'sm' ? 13 : 16} aria-hidden="true" /> : null}
            {size === 'sm' ? <span className="sr-only">{t(`serving.${key}`)}</span> : t(`serving.${key}`)}
          </span>
        )
      })}
      {rest > 0 && <span className="serving-chip serving-rest">+{rest}</span>}
    </span>
  )
}

/** Auswahlfeld für das Gastro-Profil und die Filter. */
export function ServingPicker({ value = [], onChange, keys = SERVING_KEYS }) {
  const toggle = (key) =>
    onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key])

  return (
    <div className="row-wrap">
      {keys.map((key) => {
        const Icon = SERVING_ICONS[key]
        const active = value.includes(key)
        return (
          <button
            key={key}
            type="button"
            className="chip"
            aria-pressed={active}
            onClick={() => toggle(key)}
          >
            {Icon ? <Icon size={14} aria-hidden="true" /> : null}
            {t(`serving.${key}`)}
          </button>
        )
      })}
    </div>
  )
}
