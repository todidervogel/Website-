import { useEffect, useState } from 'react'
import { CloudOff, RotateCw } from 'lucide-react'
import { beiVerbindungswechsel, changed, istOffline, MODE, request } from '../../lib/store'
import { t } from '../../design/i18n'

/**
 * Sagt es, wenn der Server nicht antwortet.
 *
 * Vorher stand in diesem Fall auf der Startseite „In deinem Umkreis wurden
 * noch keine Videos hochgeladen“ — eine Aussage über den Inhalt, obwohl gar
 * keine Verbindung zustande kam. Wer das liest, sucht den Fehler bei sich
 * oder hält die App für leer.
 *
 * Im Alleinbetrieb gibt es nichts zu melden: Dort läuft alles im Browser.
 */
export function ConnectionBanner() {
  const [offline, setOffline] = useState(istOffline)
  const [laeuft, setLaeuft] = useState(false)

  useEffect(() => beiVerbindungswechsel(() => setOffline(istOffline())), [])

  if (MODE !== 'server' || !offline) return null

  const nochmal = async () => {
    setLaeuft(true)
    try {
      /* Kommt der Aufruf durch, meldet `request` die Verbindung selbst zurück. */
      await request('/api/health')
      changed()
    } catch {
      /* Weiterhin weg — das Band bleibt stehen. */
    } finally {
      setLaeuft(false)
    }
  }

  return (
    <div className="connection-banner" role="status">
      <CloudOff size={18} className="connection-icon" />
      <span className="grow">
        <strong>{t('connection.title')}</strong> {t('connection.text')}
      </span>
      <button type="button" className="btn btn-secondary btn-sm" onClick={nochmal} disabled={laeuft}>
        <RotateCw size={16} className={laeuft ? 'spin' : undefined} />
        {t('connection.retry')}
      </button>
    </div>
  )
}
