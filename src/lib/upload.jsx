import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'

/**
 * Der Upload-Assistent (E.1 – E.6) führt über fünf Schritte. Was dabei
 * entsteht, gehört zusammen — deshalb liegt der Entwurf an einer Stelle und
 * nicht in fünf einzelnen Screens.
 *
 * Der Entwurf überlebt ein Neuladen, damit man zwischendurch nachschauen
 * kann, ohne von vorn anzufangen.
 */
const KEY = 'app-upload-draft'
const UploadContext = createContext(null)

const emptyDraft = {
  hasVideo: false,
  durationSec: 0,
  trimFrom: 0,
  trimTo: 0,
  placeId: null,
  verifiedOnSite: false,
  rating: { food: 0, service: 0, price: 0 },
  foodHot: null,
  groupSize: null,
  dishes: [],
  text: '',
  caption: '',
  visibility: 'public',
}

function read() {
  try {
    return { ...emptyDraft, ...(JSON.parse(localStorage.getItem(KEY)) ?? {}) }
  } catch {
    return emptyDraft
  }
}

export function UploadProvider({ children }) {
  const [draft, setDraft] = useState(read)

  const save = useCallback((changes) => {
    setDraft((current) => {
      const next = { ...current, ...(typeof changes === 'function' ? changes(current) : changes) }
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ohne Speicher eben flüchtig */ }
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setDraft(emptyDraft)
    try { localStorage.removeItem(KEY) } catch { /* egal */ }
  }, [])

  const value = useMemo(() => ({ draft, save, reset }), [draft, save, reset])
  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>
}

export function useUpload() {
  const ctx = useContext(UploadContext)
  if (!ctx) throw new Error('useUpload außerhalb des UploadProvider')
  return ctx
}

/**
 * Schützt die späteren Schritte: Ohne Video keine Bearbeitung, ohne Betrieb
 * keine Bewertung. Wer direkt auf Schritt 4 springt, landet dort, wo etwas
 * fehlt — statt in einem halbleeren Formular.
 */
export function UploadStepGuard({ needs = [], children }) {
  const { draft } = useUpload()
  if (needs.includes('video') && !draft.hasVideo) return <Navigate to="/upload" replace />
  if (needs.includes('place') && !draft.placeId) return <Navigate to="/upload/restaurant" replace />
  return children
}
