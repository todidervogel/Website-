/**
 * Kartenrechnung: Kacheln und Marker auf denselben Nenner bringen.
 *
 * Bisher wurden Marker über eine flache Näherung platziert (Kilometer pro
 * Breitengrad, konstant). Das genügt, solange nichts darunter liegt. Sobald
 * echte Kacheln dazukommen, muss dieselbe Projektion gelten wie bei ihnen,
 * sonst sitzt das Restaurant zwei Straßen neben seinem Haus.
 *
 * Kartenkacheln der Welt benutzen Web-Mercator. Also rechnen wir auch so.
 *
 * Nebenbei behoben: Die alte Rechnung nahm für die Höhe denselben Maßstab wie
 * für die Breite. Das stimmt nur bei einem quadratischen Kasten; auf einer
 * breiten Karte am Rechner zog es alles auseinander.
 */

const KACHEL = 256
const rad = (grad) => (grad * Math.PI) / 180

/** Punkt auf der Erde → Punkt im Einheitsquadrat (0…1). */
function mercator({ lat, lng }) {
  const begrenzt = Math.max(-85.05112878, Math.min(85.05112878, lat))
  return {
    x: (lng + 180) / 360,
    y: (1 - Math.log(Math.tan(rad(begrenzt)) + 1 / Math.cos(rad(begrenzt))) / Math.PI) / 2,
  }
}

/** Punkt im Einheitsquadrat (0…1) → Punkt auf der Erde. Die Umkehrung. */
function unMercator({ x, y }) {
  return {
    lng: x * 360 - 180,
    lat: (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI,
  }
}

/** Zoomstufen, zwischen denen sich die Karte bewegen darf. */
export const ZOOM_MIN = 2
export const ZOOM_MAX = 19

export const zoomBegrenzen = (z) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z))

/**
 * Alles, was zum Zeichnen einer Karte gebraucht wird.
 *
 * @param center   Mittelpunkt {lat, lng}
 * @param zoom     Zoomstufe, darf gebrochen sein (weiches Zoomen)
 * @param spanKm   Ersatzweise: wie viele Kilometer die Breite abdeckt
 * @param width    Breite des Kastens in Pixeln
 * @param height   Höhe des Kastens in Pixeln
 *
 * Zwei Wege hinein, weil es zwei Fragen gibt. „Zeig mir 8 km" ist die Frage
 * einer Liste mit Umkreis, „zeig mir Stufe 14" die Frage einer Karte, die man
 * schiebt und zieht. Beide enden in derselben Rechnung.
 */
export function kartenblick({ center, spanKm, zoom: zoomWunsch, width, height }) {
  if (!center || !width || !height) return null

  let weltPx
  if (Number.isFinite(zoomWunsch)) {
    /* Wie breit ist die ganze Welt auf dieser Stufe? */
    weltPx = KACHEL * 2 ** zoomWunsch
  } else {
    /* Wie viele Längengrade sind das auf dieser Breite? */
    const spanGrad = spanKm / (111.32 * Math.cos(rad(center.lat)))
    /* Wie breit wäre die ganze Welt, damit spanGrad genau `width` Pixel füllt? */
    weltPx = (width * 360) / spanGrad
  }

  /*
   * Kacheln gibt es nur in ganzen Zoomstufen. Wir nehmen die nächstgelegene
   * und gleichen den Rest über einen Maßstab aus, sonst springt die Karte
   * beim Ändern des Umkreises in Stufen statt weich.
   */
  const zoom = Math.max(1, Math.min(19, Math.round(Math.log2(weltPx / KACHEL))))
  const kachelPx = (weltPx / (KACHEL * 2 ** zoom)) * KACHEL

  const mitte = mercator(center)
  const ursprungX = mitte.x * weltPx - width / 2
  const ursprungY = mitte.y * weltPx - height / 2

  /** Erdkoordinate → Pixel im Kasten. */
  const projizieren = (punkt) => {
    const m = mercator(punkt)
    return { left: m.x * weltPx - ursprungX, top: m.y * weltPx - ursprungY }
  }

  /**
   * Pixel im Kasten → Erdkoordinate. Die Gegenrichtung.
   *
   * Gebraucht, seit man die Karte schieben und zoomen kann: Beim Zoomen mit
   * dem Rad oder zwei Fingern soll der Punkt unter dem Finger stehen bleiben.
   * Dafür muss man wissen, welcher Ort das ist.
   */
  const entprojizieren = ({ left, top }) => unMercator({
    x: (left + ursprungX) / weltPx,
    y: (top + ursprungY) / weltPx,
  })

  /**
   * Was gerade zu sehen ist, als Rechteck.
   *
   * Damit holt die Karte genau die Betriebe, die im Bild liegen, statt alle
   * im Umkreis. Bei einem Bestand über ganz Deutschland ist das der
   * Unterschied zwischen ein paar Dutzend und zwölftausend.
   */
  const nordwest = entprojizieren({ left: 0, top: 0 })
  const suedost = entprojizieren({ left: width, top: height })
  const grenzen = {
    nord: nordwest.lat,
    sued: suedost.lat,
    west: nordwest.lng,
    ost: suedost.lng,
  }

  /* Welche Kacheln liegen im Kasten? */
  const kacheln = []
  const anzahl = 2 ** zoom
  const vonX = Math.floor(ursprungX / kachelPx)
  const bisX = Math.floor((ursprungX + width) / kachelPx)
  const vonY = Math.floor(ursprungY / kachelPx)
  const bisY = Math.floor((ursprungY + height) / kachelPx)

  for (let x = vonX; x <= bisX; x += 1) {
    for (let y = vonY; y <= bisY; y += 1) {
      /* Oben und unten ist die Welt zu Ende; links und rechts geht sie weiter. */
      if (y < 0 || y >= anzahl) continue
      kacheln.push({
        schluessel: `${zoom}/${x}/${y}`,
        x: ((x % anzahl) + anzahl) % anzahl,
        y,
        zoom,
        left: x * kachelPx - ursprungX,
        top: y * kachelPx - ursprungY,
        groesse: kachelPx,
      })
    }
  }

  return {
    zoom,
    /* Die gebrochene Stufe, für das Weiterzoomen von hier aus. */
    genauerZoom: Math.log2(weltPx / KACHEL),
    kachelPx, kacheln, projizieren, entprojizieren, grenzen, weltPx,
  }
}

/**
 * Wo muss der Mittelpunkt liegen, damit ein Ort unter dem Finger bleibt?
 *
 * Beim Zoomen mit Rad oder zwei Fingern erwartet man, dass der Punkt, den man
 * anfasst, sich nicht bewegt. Google Maps macht das so, jede Karte macht das
 * so, und ohne diese Zeile springt der Ausschnitt bei jedem Zoomschritt.
 *
 * @param ort     Erdkoordinate, die stehen bleiben soll
 * @param pixel   wo sie im Kasten liegt {left, top}
 * @param zoom    die neue Zoomstufe
 */
export function zentrumHalten({ ort, pixel, zoom, width, height }) {
  const weltPx = KACHEL * 2 ** zoom
  const m = mercator(ort)
  return unMercator({
    x: m.x - (pixel.left - width / 2) / weltPx,
    y: m.y - (pixel.top - height / 2) / weltPx,
  })
}

/**
 * Adresse einer Kachel.
 *
 * OpenStreetMap stellt diese Kacheln frei bereit, erwartet dafür aber eine
 * Namensnennung und keine Massenabrufe. Für einen Prototyp ist das in
 * Ordnung; vor einem echten Start gehört hier ein eigener Kachelserver hin
 * (oder ein Anbieter, bei dem man dafür bezahlt).
 *
 * Siehe https://operations.osmfoundation.org/policies/tiles/
 */
/**
 * Die Adresse einer Kachel.
 *
 * @param basis  Adresse des eigenen Servers, oder leer
 *
 * Mit Server kommen die Kacheln von dort (`/api/karte/kachel/…`, siehe
 * Server/src/http/karte.js). Das hat vier Gründe, die dort ausführlich stehen:
 * ein einziger Ausgang, ein Zwischenspeicher auf der Serverplatte, Höflichkeit
 * gegenüber den freien Kachelservern, und ein Stilwechsel bleibt eine Zeile.
 *
 * Ohne Server, Alleinbetrieb im Browser, geht es direkt zu OpenStreetMap.
 * Dann gibt es niemanden, der vermitteln könnte.
 *
 * Die Basis kommt als Angabe herein und wird nicht hier geholt: Diese Datei
 * ist reine Rechnung, ohne Browser und ohne Zustand. Nur so lässt sie sich in
 * `tools/karte-pruefen.mjs` unter Node nachrechnen.
 */
export const kachelAdresse = ({ zoom, x, y }, basis = '') => (basis
  ? `${basis}/api/karte/kachel/${zoom}/${x}/${y}.png`
  : `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`)
