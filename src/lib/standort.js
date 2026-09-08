/**
 * Der eigene Standort.
 *
 * ┌─ Wer benutzt diese Datei ────────────────────────────────────────────────┐
 * │  src/lib/design-state.jsx      hält die Position, die alle Screens sehen │
 * │  src/routes/public/MapView.jsx der Knopf mit dem Fadenkreuz             │
 * │  App/android/…/AndroidManifest.xml  die Berechtigung dazu               │
 * │  App/package.json              @capacitor/geolocation, siehe unten      │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * ── Warum das eine eigene Datei ist ───────────────────────────────────────
 *
 * `navigator.geolocation` gibt es überall, verhält sich aber an drei Stellen
 * unterschiedlich: im Browser am Rechner, im Browser auf dem Handy und im
 * WebView der App. Vor allem im letzten Fall gibt es eine Besonderheit: Der
 * WebView fragt nur dann nach der Berechtigung, wenn die App das Geolocation-
 * Plugin mitbringt. Fehlt es, schlägt die Abfrage still fehl, und die Karte
 * bleibt für immer auf der Vorgabeposition stehen. Deshalb liegt im App-Repo
 * die Abhängigkeit, und deshalb steht dieser Hinweis hier.
 *
 * ── Warum die letzte bekannte Position gemerkt wird ───────────────────────
 *
 * Eine Standortabfrage dauert je nach Gerät ein bis zehn Sekunden. So lange
 * auf eine leere Karte zu sehen, wäre schlechter, als kurz die Position von
 * gestern zu zeigen und sie dann zu ersetzen.
 */

const SCHLUESSEL = 'app-standort'

/** Wie lange eine gemerkte Position als Startwert taugt. */
const HALTBAR_MS = 7 * 24 * 3600 * 1000

export function letzterStandort() {
  try {
    const roh = JSON.parse(localStorage.getItem(SCHLUESSEL))
    if (!roh || !Number.isFinite(roh.lat) || !Number.isFinite(roh.lng)) return null
    if (roh.zeit && Date.now() - roh.zeit > HALTBAR_MS) return null
    return { lat: roh.lat, lng: roh.lng }
  } catch {
    return null
  }
}

function merken(ort) {
  try {
    localStorage.setItem(SCHLUESSEL, JSON.stringify({ ...ort, zeit: Date.now() }))
  } catch {
    /* Privater Modus, dann eben ohne Gedächtnis. */
  }
}

/**
 * Wurde schon einmal gefragt, und was kam heraus?
 *
 * Nicht jeder Browser kennt `permissions.query` für den Standort, deshalb ist
 * „unbekannt" ein gültiges Ergebnis und kein Fehler. Gebraucht wird das nur,
 * um nicht ungefragt einen Dialog aufzuschlagen, wo es unhöflich wäre.
 */
export async function standortErlaubnis() {
  try {
    const stand = await navigator.permissions.query({ name: 'geolocation' })
    return stand.state /* 'granted' | 'denied' | 'prompt' */
  } catch {
    return 'unbekannt'
  }
}

/**
 * Den Standort holen.
 *
 * Gibt immer ein Ergebnis zurück, nie einen Fehler, damit die Oberfläche
 * sagen kann, **warum** es nicht ging:
 *
 *   'abgelehnt'       die Berechtigung wurde verweigert
 *   'zeit'            das Gerät hat zu lange gebraucht
 *   'nichtVerfuegbar' der Browser kann das gar nicht
 *   'fehler'          alles andere, etwa kein Empfang
 */
export function standortHolen({ genau = true, frist = 12000 } = {}) {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve({ ok: false, grund: 'nichtVerfuegbar' })
  }

  return new Promise((fertig) => {
    /*
     * Eine eigene Uhr zusätzlich zu `timeout`. Auf manchen Geräten meldet
     * sich der Standortdienst weder mit Erfolg noch mit Fehler, und dann
     * würde der Knopf ewig drehen. Dieselbe Lehre wie bei den Serveraufrufen.
     */
    let erledigt = false
    const abschliessen = (ergebnis) => {
      if (erledigt) return
      erledigt = true
      fertig(ergebnis)
    }
    const uhr = setTimeout(() => abschliessen({ ok: false, grund: 'zeit' }), frist + 1000)

    navigator.geolocation.getCurrentPosition(
      (treffer) => {
        clearTimeout(uhr)
        const ort = { lat: treffer.coords.latitude, lng: treffer.coords.longitude }
        merken(ort)
        abschliessen({ ok: true, ort, genauigkeitM: treffer.coords.accuracy ?? null })
      },
      (fehler) => {
        clearTimeout(uhr)
        const grund = fehler?.code === 1 ? 'abgelehnt' : fehler?.code === 3 ? 'zeit' : 'fehler'
        abschliessen({ ok: false, grund })
      },
      { enableHighAccuracy: genau, timeout: frist, maximumAge: 60000 },
    )
  })
}
