/**
 * Verweise in fremde Kartenanwendungen.
 *
 * ┌─ Wer benutzt diese Datei ────────────────────────────────────────────────┐
 * │  src/routes/public/PlacePage.jsx   Route-Knopf und Drei-Punkte-Menü      │
 * │  src/routes/public/MapView.jsx     Route aus dem Ergebnisblatt           │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * ── Warum überhaupt fremde Karten ─────────────────────────────────────────
 *
 * Wir zeigen, wo ein Betrieb liegt. Wir werden auf absehbare Zeit keine
 * Navigation bauen: Routen, Verkehr, Sprachansagen und Kartenmaterial für die
 * letzten hundert Meter sind ein eigenes Produkt. Wer losfahren will, benutzt,
 * was er ohnehin auf dem Gerät hat.
 *
 * ── Welche Adresse ────────────────────────────────────────────────────────
 *
 * Die offiziellen „universal links" von Google Maps. Auf Android und iOS
 * öffnet das die installierte App, am Rechner die Webseite. Ein `geo:`-Verweis
 * würde auf Android die Auswahl aller Kartenanwendungen zeigen, aber am
 * Rechner und auf iOS ins Leere laufen.
 *
 * Übergeben werden Koordinaten **und** Name. Die Koordinaten sind eindeutig,
 * der Name sorgt dafür, dass in der fremden App das Lokal steht und nicht ein
 * Punkt am Straßenrand.
 *
 * Kein Schlüssel, kein Konto, keine Übertragung von Daten an uns: Es ist ein
 * Verweis, den die Nutzerin selbst antippt.
 */

const koordinaten = (ort) => `${ort.lat},${ort.lng}`

/** Route dorthin, in Google Maps. */
export function routeZu(ort) {
  const ziel = new URLSearchParams({
    api: '1',
    destination: koordinaten(ort),
  })
  return `https://www.google.com/maps/dir/?${ziel}`
}

/** Den Ort in Google Maps ansehen, ohne Route. */
export function zeigenIn(ort) {
  const frage = new URLSearchParams({
    api: '1',
    query: koordinaten(ort),
  })
  return `https://www.google.com/maps/search/?${frage}`
}

/**
 * Der Verweis für Android, der die Auswahl aller Kartenanwendungen zeigt.
 *
 * Wird nur benutzt, wenn wir sicher in der App laufen. Sonst landet man am
 * Rechner auf einer leeren Seite.
 */
export function alsGeo(ort) {
  return `geo:${koordinaten(ort)}?q=${koordinaten(ort)}(${encodeURIComponent(ort.name)})`
}

/**
 * Teilen: möglichst über die Teilen-Funktion des Geräts, sonst in die
 * Zwischenablage.
 *
 * `navigator.share` gibt es nur in einem sicheren Zusammenhang und nach einer
 * echten Berührung. Bricht die Nutzerin den Dialog ab, wirft es einen Fehler,
 * und das ist kein Fehlerfall, sondern eine Entscheidung.
 */
export async function teilen({ titel, text, adresse }) {
  if (navigator.share) {
    try {
      await navigator.share({ title: titel, text, url: adresse })
      return { ok: true, weg: 'geteilt' }
    } catch (fehler) {
      if (fehler?.name === 'AbortError') return { ok: true, weg: 'abgebrochen' }
      /* Alles andere: unten weiter mit der Zwischenablage. */
    }
  }

  try {
    await navigator.clipboard.writeText(adresse)
    return { ok: true, weg: 'kopiert' }
  } catch {
    return { ok: false }
  }
}
