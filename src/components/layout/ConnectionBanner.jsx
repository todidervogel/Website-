import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CloudOff, Download, RotateCw, WifiOff } from 'lucide-react'
import {
  adresseHolen, beiVerbindungswechsel, changed, istOffline, MODE, request,
  serverPruefen, setServerAdresse,
} from '../../lib/store'
import { useDesignState } from '../../lib/design-state'
import { t } from '../../design/i18n'

/**
 * Sagt es, wenn der Server nicht antwortet.
 *
 * ┌─ Woran das hängt ────────────────────────────────────────────────────────┐
 * │  src/lib/store/connection.js   merkt sich, ob ein Aufruf am Netz scheiterte │
 * │  src/lib/store/api.js          adresseHolen(), serverPruefen()           │
 * │  Server/adresse.json           dort steht die aktuelle Adresse           │
 * │  src/routes/nutzer/Settings.jsx   dieselbe Sache in ausführlich          │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * ── Zwei Fälle, zwei Meldungen ────────────────────────────────────────────
 *
 * **Der Server antwortet nicht.** Vorher stand in diesem Fall auf der
 * Startseite „In deinem Umkreis wurden noch keine Videos hochgeladen", eine
 * Aussage über den Inhalt, obwohl gar keine Verbindung zustande kam. Wer das
 * liest, sucht den Fehler bei sich oder hält die App für leer.
 *
 * **Es ist gar keiner eingestellt.** Dann läuft die App mit den Daten auf dem
 * Gerät. Das funktioniert, ist aber etwas anderes, als die meisten erwarten:
 * Nichts davon wird geteilt, niemand sonst sieht es. In der App sagen wir das,
 * auf der Webseite nicht, denn dort ist der Alleinbetrieb der Normalfall für
 * Besucher ohne Konto.
 *
 * Beide Male gibt es denselben Ausweg mit einem Tipp: die aktuelle Adresse
 * holen. Der Server hinterlegt sie bei jedem Start, siehe Server/docs/ADRESSE.md.
 */
export function ConnectionBanner() {
  const { isApp } = useDesignState()
  const [offline, setOffline] = useState(istOffline)
  const [laeuft, setLaeuft] = useState(false)
  const [sucht, setSucht] = useState(false)
  const [meldung, setMeldung] = useState(null)

  useEffect(() => beiVerbindungswechsel(() => setOffline(istOffline())), [])

  /*
   * Einmal beim Start nachfassen. Ohne das erscheint das Band erst, nachdem
   * ein Bildschirm schon vergeblich Daten geholt hat, und bis dahin steht dort
   * eine falsche Leermeldung.
   */
  useEffect(() => {
    if (MODE !== 'server') return
    request('/api/health').catch(() => { /* `request` meldet die Störung selbst. */ })
  }, [])

  const keinServer = MODE !== 'server'

  /* Auf der Webseite ist der Alleinbetrieb kein Fehler, in der App schon. */
  if (keinServer && !isApp) return null
  if (!keinServer && !offline) return null

  const nochmal = async () => {
    setLaeuft(true)
    try {
      /* Kommt der Aufruf durch, meldet `request` die Verbindung selbst zurück. */
      await request('/api/health')
      changed()
    } catch {
      /* Weiterhin weg, das Band bleibt stehen. */
    } finally {
      setLaeuft(false)
    }
  }

  /**
   * Die aktuelle Adresse holen und übernehmen.
   *
   * Geprüft wird vor dem Übernehmen: Eine Adresse, die im Verzeichnis steht,
   * muss noch nicht antworten. Der Lauf kann in der Zwischenzeit vorbei sein.
   */
  const adresseUebernehmen = async () => {
    setSucht(true)
    setMeldung(null)
    const gefunden = await adresseHolen()

    if (gefunden.grund !== 'gefunden') {
      setSucht(false)
      return setMeldung(t(`connection.found${gefunden.grund === 'beendet' ? 'Ended'
        : gefunden.grund === 'keiner' ? 'None' : 'Error'}`))
    }

    const erreichbar = await serverPruefen(gefunden.adresse)
    setSucht(false)
    if (!erreichbar.ok) return setMeldung(erreichbar.error)

    /* Ab hier lädt die Seite neu. */
    return setServerAdresse(gefunden.adresse)
  }

  return (
    <div className="connection-banner" role="status">
      {keinServer ? <WifiOff size={18} className="connection-icon" /> : <CloudOff size={18} className="connection-icon" />}

      <span className="grow">
        <strong>{keinServer ? t('connection.noServerTitle') : t('connection.title')}</strong>{' '}
        {keinServer ? t('connection.noServerText') : t('connection.text')}
        {meldung && <em className="connection-hinweis">{meldung}</em>}
      </span>

      <span className="connection-aktionen">
        <button type="button" className="btn btn-secondary btn-sm" onClick={adresseUebernehmen} disabled={sucht}>
          <Download size={16} className={sucht ? 'spin' : undefined} />
          {sucht ? t('connection.checking') : t('connection.fetchAddress')}
        </button>

        {!keinServer && (
          <button type="button" className="btn btn-quiet btn-sm" onClick={nochmal} disabled={laeuft}>
            <RotateCw size={16} className={laeuft ? 'spin' : undefined} />
            {t('connection.retry')}
          </button>
        )}

        <Link to="/einstellungen" className="btn btn-quiet btn-sm">{t('connection.settings')}</Link>
      </span>
    </div>
  )
}
