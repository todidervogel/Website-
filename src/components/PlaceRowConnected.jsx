import { PlaceRow as PurePlaceRow, PlaceSummary as PurePlaceSummary, useToast } from '../design/ui'
import { api, formatDistance } from '../lib/store'
import { openSentence } from '../lib/hours-text'
import { useRequireLogin } from '../lib/auth'
import { t } from '../design/i18n'

/**
 * Die Betriebszeile aus dem Design-System, an die Anwendung angeschlossen.
 *
 * Der Baustein selbst kennt weder Daten noch Anmeldung — hier kommt beides
 * dazu: die Entfernung als Text, der Öffnungssatz und das Lesezeichen.
 */
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
