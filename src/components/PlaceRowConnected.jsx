import { PlaceRow as PurePlaceRow, PlaceSummary as PurePlaceSummary, useToast } from '../design/ui'
import { titelbild } from '../domain'
import { api, formatDistance } from '../lib/store'
import { openSentence } from '../lib/hours-text'
import { useRequireLogin } from '../lib/auth'
import { t } from '../design/i18n'

/**
 * Die Betriebszeile aus dem Design-System, an die Anwendung angeschlossen.
 *
 * Der Baustein selbst kennt weder Daten noch Anmeldung, hier kommt beides
 * dazu: die Entfernung als Text, der Öffnungssatz, das Lesezeichen und das
 * Bild.
 */

/**
 * Das Bild eines Betriebs: das echte, wenn es eines gibt, sonst das
 * gezeichnete aus `src/domain/titelbild.js` (dort steht auch, warum es keine
 * fremden Fotos sind).
 *
 * Als Daten-Adresse, nicht über den Server: So sieht die Liste im
 * Alleinbetrieb genauso aus wie mit Server, und es gibt keine Anfrage, die
 * scheitern kann.
 */
export const bildVon = (place) => (place.bildUrl
  ? place.bildUrl
  : `data:image/svg+xml;utf8,${encodeURIComponent(titelbild(place))}`)

export function PlaceRow({ place, showSave = true, compact }) {
  const toast = useToast()
  const requireLogin = useRequireLogin()

  const toggleSave = requireLogin(async () => {
    const saved = await api.social.toggleSave(null, 'place', place.id)
    toast(saved ? t('toast.saved') : t('common.removed'))
  })

  return (
    <PurePlaceRow
      place={{ ...place, distance: formatDistance(place.distanceKm) }}
      showSave={showSave}
      compact={compact}
      saved={place.viewerSaved}
      onToggleSave={toggleSave}
      openText={openSentence(place)}
      bild={bildVon(place)}
    />
  )
}

export function PlaceSummary({ place, right }) {
  return (
    <PurePlaceSummary
      place={{ ...place, distance: formatDistance(place.distanceKm) }}
      right={right}
      openText={place.open ? t('common.openNow') : t('hours.closed')}
    />
  )
}
