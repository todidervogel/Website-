/**
 * Gemeinsames Vokabular.
 *
 * Welche Angebotsarten und welche Allergene es gibt, ist eine Frage der
 * Gestaltung, es gibt für jede ein Symbol, eine Farbe und eine Beschriftung.
 * Deshalb steht die Liste hier und nicht in den Daten.
 *
 * Der Server führt dieselben Schlüssel; wer einen hinzufügt, ergänzt beide
 * Stellen und den Text in `i18n/de.json`.
 */

/** Was gibt es hier zu essen und zu trinken? (C.2, C.3, C.5) */
export const SERVING_KEYS = [
  'getraenke', 'fruehstueck', 'vegan', 'vegetarisch',
  'fleisch', 'fisch', 'meeresfruechte', 'suess', 'halal', 'glutenfrei',
]

/** Die vierzehn kennzeichnungspflichtigen Allergene. Reihenfolge = Nummerierung. */
export const ALLERGEN_KEYS = [
  'gluten', 'krebstiere', 'ei', 'fisch', 'erdnuss', 'soja', 'milch',
  'schalenfruechte', 'sellerie', 'senf', 'sesam', 'sulfite', 'lupine', 'weichtiere',
]

/** Kennzeichnung eines Gerichts. */
export const DIET_KEYS = ['vegan', 'vegetarisch', 'glutenfrei']

/** Merkmale eines Betriebs, Umstände, nicht das Essen. */
export const FEATURE_KEYS = [
  'barrierefrei', 'aussenplaetze', 'vegetarisch', 'vegan', 'glutenfrei', 'hunde',
  'wlan', 'reservierung', 'kartenzahlung', 'parkplaetze', 'lieferung', 'abholung',
]

export const CATEGORY_KEYS = [
  'restaurant', 'cafe', 'bar', 'imbiss', 'baeckerei', 'eisdiele', 'pub', 'sonstiges',
]
