# Prüfskripte

```bash
npm run pruefen:i18n        # Übersetzungslücken, ohne Browser, in einer Sekunde
```

Für die übrigen braucht es eine laufende Vorschau:

```bash
npm run build:test          # Build mit spürbarer Verzögerung (VITE_LATENCY=400)
npx vite preview --port 4173 --strictPort

npm run pruefen:routen      # 55 Routen × 5 Rollen
npm run pruefen:verhalten   # 27 Abläufe
```

## Gegen den Server

`tools/gegen-server.mjs` prüft, was nur im Serverbetrieb gilt: dass die Daten
wirklich von dort kommen, dass die Anmeldung ein Neuladen übersteht, dass die
Rechte am Server hängen und dass zwei Browser denselben Stand sehen.

```bash
# Fenster 1, im Server-Repo
npm start

# Fenster 2, hier
VITE_API=http://localhost:4000 npm run build
npx vite preview --port 4174 --strictPort
node tools/gegen-server.mjs
```

Der Browser wird über `PW_CHROME` gefunden, falls er nicht am üblichen Ort
liegt. `PW_TIMEOUT` hebt die Wartezeit je Schritt an, wenn der Rechner
ausgelastet ist.
