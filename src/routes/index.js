/**
 * TEIL J — Übersicht aller Routen.
 * Diese Tabelle ist die einzige Quelle für den Router und für den
 * Screen-Index unter /uebersicht.
 */
export const routeGroups = [
  {
    id: 'public',
    routes: [
      { path: '/', label: 'Startseite', spec: 'C.1' },
      { path: '/karte', label: 'Kartenansicht', spec: 'C.2' },
      { path: '/feed', label: 'Video-Feed', spec: 'C.6' },
      { path: '/suche', label: 'Suchergebnisse', spec: 'C.5' },
      { path: '/g/trattoria-bella', label: 'Gastro-Seite', spec: 'C.3', pattern: '/g/[slug]' },
      { path: '/g/trattoria-bella?src=qr', label: 'Gastro-Seite über QR-Code', spec: 'D.6', pattern: '/g/[slug]?src=qr' },
      { path: '/g/trattoria-bella/speisekarte', label: 'Speisekarte', spec: 'C.8', pattern: '/g/[slug]/speisekarte' },
      { path: '/g/gruenkern/speisekarte', label: 'Speisekarte (vegan)', spec: 'C.8', pattern: '/g/[slug]/speisekarte' },
      { path: '/v/v1', label: 'Videodetail', spec: 'C.7', pattern: '/v/[id]' },
      { path: '/p/lisa_k', label: 'Fremdes Profil', spec: 'E.8', pattern: '/p/[username]' },
      { path: '/fuer-gastronomen', label: 'Landingpage Gastro', spec: 'F.13' },
      { path: '/gastro/eintragen', label: 'Betrieb eintragen', spec: 'F.14' },
    ],
  },
  {
    id: 'account',
    routes: [
      { path: '/registrieren', label: 'Registrierung', spec: 'D.1' },
      { path: '/registrieren/code', label: 'Nummer bestätigen', spec: 'D.2' },
      { path: '/anmelden', label: 'Anmeldung', spec: 'D.3' },
      { path: '/passwort-vergessen', label: 'Passwort zurücksetzen', spec: 'D.4' },
      { path: '/passwort-neu', label: 'Neues Passwort', spec: 'D.5' },
    ],
  },
  {
    id: 'user',
    routes: [
      { path: '/upload', label: 'Aufnehmen', spec: 'E.1' },
      { path: '/upload/bearbeiten', label: 'Zuschneiden', spec: 'E.2' },
      { path: '/upload/restaurant', label: 'Betrieb wählen', spec: 'E.3' },
      { path: '/upload/bewertung', label: 'Bewertung', spec: 'E.5' },
      { path: '/upload/veroeffentlichen', label: 'Veröffentlichen', spec: 'E.6' },
      { path: '/profil', label: 'Eigenes Profil', spec: 'E.7' },
      { path: '/benachrichtigungen', label: 'Benachrichtigungen', spec: 'E.13' },
      { path: '/einstellungen', label: 'Einstellungen', spec: 'E.10' },
      { path: '/einstellungen/profil', label: 'Profil bearbeiten', spec: 'E.9' },
      { path: '/einstellungen/daten', label: 'Datenexport', spec: 'E.12' },
    ],
  },
  {
    id: 'gastro',
    routes: [
      { path: '/gastro/anmelden', label: 'Anmeldung', spec: 'F.1' },
      { path: '/gastro/willkommen', label: 'Erstes Passwort', spec: 'F.2' },
      { path: '/gastro/einrichtung', label: 'Einrichtungsassistent', spec: 'F.3' },
      { path: '/gastro', label: 'Dashboard', spec: 'F.4' },
      { path: '/gastro/videos', label: 'Videos', spec: 'F.5' },
      { path: '/gastro/speisekarte', label: 'Speisekarte', spec: 'F.6' },
      { path: '/gastro/bewertungen', label: 'Bewertungen', spec: 'F.7' },
      { path: '/gastro/profil', label: 'Profil', spec: 'F.9' },
      { path: '/gastro/qr', label: 'QR-Codes', spec: 'F.10' },
      { path: '/gastro/einstellungen', label: 'Einstellungen', spec: 'F.11' },
    ],
  },
  {
    id: 'admin',
    routes: [
      { path: '/admin', label: 'Übersicht', spec: 'G.2' },
      { path: '/admin/videos', label: 'Video-Freigabe', spec: 'G.3' },
      { path: '/admin/meldungen', label: 'Meldungen', spec: 'G.4' },
      { path: '/admin/betriebe', label: 'Betriebe', spec: 'G.5' },
      { path: '/admin/einladungen', label: 'Einladungen', spec: 'G.6' },
      { path: '/admin/nutzer', label: 'Nutzer', spec: 'G.7' },
      { path: '/admin/vorschlaege', label: 'Vorschläge', spec: 'G.8' },
      { path: '/admin/protokoll', label: 'Protokoll', spec: 'G.9' },
    ],
  },
  {
    id: 'legal',
    routes: [
      { path: '/impressum', label: 'Impressum', spec: 'H' },
      { path: '/datenschutz', label: 'Datenschutzerklärung', spec: 'H' },
      { path: '/agb', label: 'AGB', spec: 'H' },
      { path: '/agb-gastro', label: 'Nutzungsbedingungen für Gastronomen', spec: 'H' },
      { path: '/richtlinien', label: 'Community-Richtlinien', spec: 'H' },
      { path: '/cookies', label: 'Cookie-Einstellungen', spec: 'H' },
    ],
  },
  {
    id: 'errors',
    routes: [
      { path: '/404', label: 'Seite nicht gefunden', spec: 'I' },
      { path: '/500', label: 'Serverfehler', spec: 'I' },
      { path: '/offline', label: 'Keine Verbindung', spec: 'I' },
      { path: '/403', label: 'Kein Zugriff', spec: 'I' },
    ],
  },
]

export const allRoutes = routeGroups.flatMap((g) => g.routes)
