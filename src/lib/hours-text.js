import { weekRows } from './store'
import { t } from '../design/i18n'

/**
 * Aus dem Öffnungszustand wird ein Satz.
 *
 * Die Fachlogik liefert nur Zahlen und Tageskürzel — sie kennt keine Sprache.
 * Hier entsteht daraus „Jetzt geöffnet · bis 22:00" oder „Geschlossen ·
 * öffnet morgen 08:00".
 */
export function openSentence(place) {
  if (!place) return ''
  if (place.open) return t('hours.openUntil', { time: place.until })
  if (!place.nextAt) return t('hours.closed')
  const day =
    place.nextDay === 'today' ? t('hours.today')
      : place.nextDay === 'tomorrow' ? t('hours.tomorrow')
        : t(`hours.days.${place.nextDay}`)
  return t('hours.closedUntil', { day, time: place.nextAt })
}

/** Die sieben Zeilen für die Tabelle — geschlossene Tage ausgeschrieben. */
export function weekRowsText(hours) {
  return weekRows(hours).map(([day, time]) => [day, time ?? t('hours.closed')])
}
