import { initialDatabase } from '../src/domain/seed.js'

/**
 * Der Datenbestand, gegen den geprüft wird.
 *
 * ┌─ Wer benutzt diese Datei ────────────────────────────────────────────────┐
 * │  tools/verhalten.mjs   die Verhaltenstests                               │
 * │  tools/bilder.mjs      die Bildschirmfotos zur Prüfung des Designs       │
 * │  src/domain/seed.js    der echte Ausgangsbestand, auf dem das hier steht │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * ── Warum es diese Datei gibt ─────────────────────────────────────────────
 *
 * Bis zum MVP standen im Ausgangsbestand erfundene Videos, Bewertungen und
 * Speisekarten. Die Prüfungen zeigten darauf — „öffne die Speisekarte von
 * Trattoria Bella" — und die Bildschirmfotos sahen nach voller Anwendung aus.
 *
 * Für den Betrieb war das falsch: Niemand soll erfundene Inhalte neben echten
 * sehen. Für die Prüfung war es aber richtig: Ein leerer Feed zeigt nicht, ob
 * ein Video richtig sitzt.
 *
 * Also getrennt. Der Ausgangsbestand ist leer, und was zum Prüfen gebraucht
 * wird, steht hier — sichtbar als das, was es ist, und nirgends im Programm.
 *
 * Der Bestand wird über `localStorage['app-db']` eingespielt, bevor die Seite
 * lädt. Die Kennungen der Konten (u1, g1, a1) kommen aus dem echten
 * Ausgangsbestand, damit Rollen und Rechte dieselben sind wie im Betrieb.
 */

const hm = (h, m = 0) => h * 60 + m

const ZEITEN = {
  mo: [[hm(11, 30), hm(22)]], di: [[hm(11, 30), hm(22)]], mi: [[hm(11, 30), hm(22)]],
  do: [[hm(11, 30), hm(23)]], fr: [[hm(11, 30), hm(23, 30)]], sa: [[hm(12), hm(23, 30)]],
  so: [[hm(12), hm(21)]],
}

/** Der Betrieb, an dem die Prüfungen hängen. */
export const PRUEF_BETRIEB = {
  id: 'pruef-1',
  slug: 'pruef-trattoria',
  name: 'Prüf-Trattoria',
  cuisine: 'Italienisch',
  tags: ['Italienisch', 'Pizza'],
  price: '€€',
  category: 'restaurant',
  serving: ['fleisch', 'fisch', 'vegetarisch', 'suess'],
  lat: 48.5333, lng: 8.0833,
  address: 'Prüfstraße 1', zip: '77704', city: 'Oberkirch', country: 'DE', region: 'oberkirch',
  phone: '+49 7802 000000', website: 'pruef-trattoria.example',
  description: 'Betrieb für die Prüfungen. Kommt im Ausgangsbestand nicht vor.',
  features: ['aussenplaetze', 'vegetarisch', 'reservierung', 'kartenzahlung', 'wlan'],
  hours: ZEITEN,
  menuNote: 'Alle Preise in Euro inkl. MwSt.',
  claimStatus: 'verified', claimedBy: 'g1', status: 'active', hasCover: true,
}

const KATEGORIEN = [
  { id: 'pk1', placeId: 'pruef-1', name: 'Pizza aus dem Holzofen', description: '', sort: 0 },
  { id: 'pk2', placeId: 'pruef-1', name: 'Pasta', description: 'Täglich frisch.', sort: 1 },
  { id: 'pk3', placeId: 'pruef-1', name: 'Dolci', description: '', sort: 2 },
]

const GERICHTE = [
  { id: 'pd1', placeId: 'pruef-1', categoryId: 'pk1', name: 'Pizza Margherita', description: 'Tomate, Mozzarella, Basilikum.', priceCents: 950, diet: ['vegetarisch'], allergens: ['gluten', 'milch'], spicy: 0, popular: true, available: true, confirmed: true, sort: 0 },
  { id: 'pd2', placeId: 'pruef-1', categoryId: 'pk1', name: 'Pizza Diavola', description: 'Scharfe Salami, Chili.', priceCents: 1250, diet: [], allergens: ['gluten', 'milch'], spicy: 2, popular: false, available: true, confirmed: true, sort: 1 },
  { id: 'pd3', placeId: 'pruef-1', categoryId: 'pk2', name: 'Tagliatelle al Ragù', description: 'Vier Stunden geschmort.', priceCents: 1400, diet: [], allergens: ['gluten', 'ei', 'sellerie'], spicy: 0, popular: true, available: true, confirmed: true, sort: 0 },
  { id: 'pd4', placeId: 'pruef-1', categoryId: 'pk2', name: 'Cacio e Pepe', description: 'Pecorino, Pfeffer, sonst nichts.', priceCents: 1200, diet: ['vegetarisch'], allergens: ['gluten', 'milch'], spicy: 0, popular: false, available: false, confirmed: true, sort: 1 },
  { id: 'pd5', placeId: 'pruef-1', categoryId: 'pk3', name: 'Tiramisu', description: 'Hausgemacht.', priceCents: 550, diet: ['vegetarisch'], allergens: ['gluten', 'ei', 'milch'], spicy: 0, popular: true, available: true, confirmed: true, sort: 0 },
]

const heute = new Date().toISOString().slice(0, 10)
const vorTagen = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)

const VIDEOS = [
  { id: 'pv1', placeId: 'pruef-1', authorId: 'u1', authorType: 'user', caption: 'Die Pizza kam nach zwölf Minuten und war noch am Blubbern.', views: 12400, durationSec: 35, verifiedOnSite: true, visibility: 'public', status: 'published', createdAt: vorTagen(2) },
  { id: 'pv2', placeId: 'pruef-1', authorId: 'u2', authorType: 'user', caption: 'Tiramisu im Glas — süß, aber nicht zu süß.', views: 3910, durationSec: 18, verifiedOnSite: true, visibility: 'public', status: 'published', createdAt: vorTagen(4) },
  { id: 'pv3', placeId: 'pruef-1', authorId: 'u2', authorType: 'user', caption: 'Wartet auf die Freigabe.', views: 0, durationSec: 22, verifiedOnSite: false, visibility: 'public', status: 'pending_review', createdAt: heute },
]

const BEWERTUNGEN = [
  { id: 'pr1', videoId: 'pv1', placeId: 'pruef-1', authorId: 'u2', createdAt: vorTagen(2), verifiedOnSite: true, ratingFood: 4, ratingService: 5, ratingPrice: 3, groupSize: 2, foodHot: true, dishes: [{ dishId: 'pd1', name: 'Pizza Margherita', rating: 5 }], text: 'Es war voll, trotzdem hat alles keine 20 Minuten gedauert. Beim Preis merkt man die Lage.', likes: 12, answer: null },
  { id: 'pr2', videoId: null, placeId: 'pruef-1', authorId: 'u1', createdAt: vorTagen(6), verifiedOnSite: false, ratingFood: 5, ratingService: 3, ratingPrice: 4, groupSize: 4, foodHot: true, dishes: [{ dishId: 'pd3', name: 'Tagliatelle al Ragù', rating: 5 }], text: 'Essen hervorragend, Service überfordert. Kommen trotzdem wieder.', likes: 4, answer: { text: 'Danke für die Rückmeldung — wir haben nachbesetzt.', createdAt: vorTagen(5) } },
]

/**
 * Baut den Prüfbestand: der echte Ausgangsbestand plus das, was zum Prüfen
 * gebraucht wird.
 */
export function pruefbestand() {
  const basis = initialDatabase()

  /* Ein zweites Konto, damit „gefällt mir" und „folgt" jemanden haben. */
  const zweiter = {
    id: 'u2', username: 'pruef_zwei', name: 'Prüf-Zwei', email: 'zwei@pruefung.invalid',
    password: 'Pruefung1!', role: 'user', private: false, joined: vorTagen(30),
    bio: 'Zweites Konto für die Prüfungen.', website: '', radius: 5,
    status: 'active', reportCount: 0,
    emailVerified: true, phoneVerified: true, verificationSkipped: false,
    notify: { follows: true, likes: true, replies: true, moderation: true },
  }

  /* Das Gastro-Konto zeigt auf den Prüfbetrieb — sonst bearbeitet es einen
     echten importierten Betrieb, und das prüft die falsche Sache. */
  const users = [...basis.users.map((u) => (u.role === 'gastro' ? { ...u, placeId: 'pruef-1' } : u)), zweiter]

  return {
    ...basis,
    users,
    places: [PRUEF_BETRIEB, ...basis.places],
    menuCategories: KATEGORIEN,
    dishes: GERICHTE,
    videos: VIDEOS,
    reviews: BEWERTUNGEN,
    follows: [{ followerId: 'u2', followingId: 'u1', status: 'accepted' }],
    likes: [{ userId: 'u2', videoId: 'pv1' }],
    saves: [{ userId: 'u1', type: 'place', targetId: 'pruef-1' }],
    notifications: [
      { id: 'pn1', userId: 'u1', type: 'follow', actor: 'pruef_zwei', text: 'folgt dir jetzt.', createdAt: `${heute}T07:10:00`, unread: true },
      { id: 'pn2', userId: 'u1', type: 'like', actor: 'pruef_zwei', text: 'gefällt dein Video.', createdAt: `${heute}T04:20:00`, unread: true },
    ],
    reports: [
      { id: 'pm1', createdAt: heute, reporterId: 'u2', targetType: 'video', targetId: 'pv1', label: 'pv1 · Prüf-Trattoria', reason: 'wrong_place', note: '', count: 1, status: 'open', handledBy: null },
    ],
    suggestions: [
      { id: 'ps1', name: 'Vorgeschlagener Betrieb', address: 'Prüfweg 2, 77704 Oberkirch', type: 'imbiss', reportedBy: 'pruef_zwei', createdAt: heute, status: 'open' },
    ],
    invites: [{ id: 'pi1', placeId: 'pruef-1', email: 'chef@pruefung.invalid', sentAt: heute, status: 'opened' }],
    auditLog: [{ id: 'pl1', at: `${heute}T09:14:00`, admin: 'topic@intern', action: 'Video freigegeben', object: 'pv1', note: '' }],
    searchHistory: ['pizza', 'tiramisu'],
  }
}

/** So, wie der Browser ihn erwartet (siehe src/lib/store/local-store.js). */
export const alsSpeicherstand = () => ({ version: 3, data: pruefbestand() })
