import { createContext, useContext } from 'react'
import {
  BarChart3, ClipboardList, Image, QrCode, Settings, Star, Video,
} from 'lucide-react'
import { ConsoleAccount, ConsolePage } from '../../components/layout'
import { LoadingBlock } from '../../design/ui'
import { useSession } from '../../lib/session'
import { api, useQuery } from '../../lib/store'
import { t } from '../../design/i18n'

const ITEMS = [
  { to: '/gastro', label: t('gastro.nav.overview'), icon: BarChart3 },
  { to: '/gastro/videos', label: t('gastro.nav.videos'), icon: Video },
  { to: '/gastro/speisekarte', label: t('gastro.nav.menu'), icon: ClipboardList },
  { to: '/gastro/bewertungen', label: t('gastro.nav.reviews'), icon: Star },
  { to: '/gastro/profil', label: t('gastro.nav.profile'), icon: Image },
  { to: '/gastro/qr', label: t('gastro.nav.qr'), icon: QrCode },
  { to: '/gastro/einstellungen', label: t('gastro.nav.settings'), icon: Settings },
]

const PlaceContext = createContext(null)

/** Der Betrieb, für den dieser Bereich gerade steht. */
export function useMyPlace() {
  return useContext(PlaceContext)
}

/**
 * Rahmen aller Gastro-Screens (F.4 Seitenleiste).
 *
 * Welcher Betrieb hier gezeigt wird, hängt am angemeldeten Konto. Admins
 * dürfen ebenfalls hinein und sehen dann den ersten Betrieb — praktisch für
 * die Prüfung, ohne ein zweites Konto zu brauchen.
 */
export function GastroShell({ title, children }) {
  const { placeId, isAdmin } = useSession()
  const { data: place, loading } = useQuery(
    () => (placeId ? api.places.byId(placeId) : api.places.bySlug('trattoria-bella')),
    [placeId, isAdmin],
  )

  return (
    <ConsolePage
      title={title}
      items={ITEMS}
      base="/gastro"
      headerSuffix={t('gastro.brandSuffix')}
      footerSlot={place ? <ConsoleAccount name={place.name} sub={place.city} /> : null}
    >
      {loading || !place
        ? <LoadingBlock />
        : <PlaceContext.Provider value={place}>{children}</PlaceContext.Provider>}
    </ConsolePage>
  )
}
