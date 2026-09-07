# Website

Die Weboberfläche: alle Screens, Routen, Formulare, Sitzung. Läuft **allein im
Browser** oder **gegen den Server** — dieselbe Oberfläche, dieselbe Fachlogik.

```bash
npm install
npm run dev        # http://localhost:5173 — allein im Browser
```

Zum Anmelden: `max@beispiel.de` / `Passwort123`. Weitere Zugänge weiter unten,
oder unten rechts im Design-Panel über die Zeile **Rolle**.

## Die zwei Betriebsarten

| | Allein im Browser | Gegen den Server |
|---|---|---|
| Start | `npm run dev` | `VITE_API=http://localhost:4000 npm run dev` |
| Daten | im lokalen Speicher des Browsers | in `data/db.json` beim Server |
| Rechte | dieselbe Aufrufliste, lokal ausgeführt | am Server, nicht zu umgehen |
| Zwei Geräte | jedes für sich | sehen denselben Stand |
| Wofür | Oberfläche ansehen und entwickeln | den MVP wirklich ausprobieren |

Welche Betriebsart läuft, steht im Design-Panel unter **Betriebsart**.

### Den ganzen MVP starten

```bash
# Fenster 1 — Repo Server
npm start                                  # http://localhost:4000

# Fenster 2 — hier
VITE_API=http://localhost:4000 npm run dev
```

Jetzt zwei Browserfenster öffnen, in einem als Gastro ein Gericht anlegen und
im anderen die Speisekarte neu laden: Es ist da. Genau das geht im
Alleinbetrieb nicht.

## Zugänge

Alles erfunden. Bestätigungscode bei der Registrierung: `123456`.

| Rolle | E-Mail | Passwort | Landet auf |
|---|---|---|---|
| Nutzer | `max@beispiel.de` | `Passwort123` | `/feed` |
| Nutzer | `lisa@beispiel.de` | `Passwort123` | `/feed` |
| Gastro | `chef@trattoria-bella.de` | `Gastro123` | `/gastro` |
| Gastro (erstes Login) | `hallo@morgenrot-cafe.de` | `Start1234` | `/gastro/willkommen` |
| Admin | `ana@intern` | `Admin1234` | `/admin` |

## Aufbau

```
src/
  App.jsx                 alle Routen
  design/                 ◄ Kopie aus dem Repo `design` — nicht hier ändern
  domain/                 ◄ Kopie aus dem Repo `Server` — nicht hier ändern
  lib/
    store/
      api.js              der Zugang: lokal oder über HTTP
      local-store.js      Datenhaltung im Browser
      events.js           wer schreibt, sagt Bescheid
      index.jsx           useQuery, useMutation
    session.jsx           Anmeldung in beiden Betriebsarten
    auth.jsx              Routenwächter und Anmelde-Schranke
    form.js               useForm mit Regelwerk
    upload.jsx            der Upload-Entwurf über fünf Schritte
    design-state.jsx      Ziel, Gerät, Darstellung, Umkreis, Position
    hours-text.js         aus dem Öffnungszustand wird ein Satz
  components/
    layout/               Kopfleiste, Fußzeile, untere Navigation, Konsolen
    PlaceRowConnected.jsx Design-Baustein + Daten
    LoginGate.jsx         „Dafür brauchst du ein Konto"
  routes/                 alle Screens

tools/                    Prüfskripte und der Abgleich, siehe tools/README.md
```

### Warum liegen `design/` und `domain/` hier als Kopie?

Damit `npm install && npm run dev` genügt — ohne zweites Repository, ohne
Netz, ohne Paketregister. Geändert wird trotzdem nur im Original:

```bash
npm run sync:design    # holt src/design aus dem Repo design
npm run sync:domain    # holt src/domain aus dem Repo Server
npm run sync           # beides

npm run sync:design -- --from ../design     # aus einem lokalen Ordner
```

Der Abgleich überschreibt die Ordner vollständig. Wer hier hineinschreibt,
verliert es beim nächsten Mal.

### Warum kennt kein Screen die Betriebsart?

`api.places.list({…})` gibt in beiden Fällen ein Versprechen zurück. Im
Alleinbetrieb läuft die Fachlogik direkt im Browser (mit einer kleinen
absichtlichen Verzögerung, sonst gäbe es keine Ladezustände zu sehen), im
Serverbetrieb geht derselbe Aufruf über HTTP. Die Regeln, wer was darf, stehen
beide Male in derselben Datei — `src/domain/calls.js`.

## Website und App

Derselbe Code, zwei Ziele. `platform` wird über Capacitor erkannt und lässt
sich im Design-Panel umschalten, um beides am Rechner anzusehen.

| | Website | App |
|---|---|---|
| Untere Leiste (mobil) | Feed · Karte · Suche · Profil | zusätzlich **Aufnehmen** |
| Gastmodus | ja, zum Umsehen | **nein** — ohne Anmeldung die Anmeldeseite |
| Fußzeile | ja | nein, Rechtstexte in den Einstellungen |
| Dunkelmodus | ja | ja |

Der Dunkelmodus steht auf **Automatisch** und folgt dem Gerät. Der Umschalter
sitzt in der Kopfleiste — auch auf der Anmeldeseite, sonst käme man in der App
gar nicht an ihn heran.

## Prüfen

```bash
npm run pruefen:i18n
npm run build:test && npx vite preview --port 4173 --strictPort
npm run pruefen:routen        # 275 Seitenaufrufe
npm run pruefen:verhalten     # 27 Abläufe
node tools/gegen-server.mjs   # 7 Prüfungen im Serverbetrieb
```

## Was noch fehlt

- **Videos**: Aufnahme und Wiedergabe sind angedeutet.
- **Karte**: Die Marker stehen an den richtigen Stellen, aber ohne Kacheln
  darunter. MapLibre fehlt.
- **GPS**: Die Position steht auf Prenzlauer Berg, verschiebbar über die
  Ortssuche.
- **E-Mail und SMS**: Der Bestätigungscode ist immer `123456`, und „Passwort
  vergessen" sagt offen, dass es keinen Versand gibt.
- **Bilder**: Platzhalterflächen.
- **Rechtstexte**: Blindtext, vor dem Start juristisch prüfen lassen.

Der weitere Kontext — Konzept, Entscheidungen, nächste Schritte — liegt im
Repository **Brain**.
