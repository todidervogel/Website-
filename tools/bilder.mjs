import { chromium } from 'playwright'
import { mkdirSync, rmSync } from 'node:fs'
import { alsSpeicherstand } from './pruefbestand.mjs'

/**
 * Macht Bildschirmfotos von allen wichtigen Screens in mehreren Breiten.
 *
 * Der Zweck ist nicht Regression, sondern Hinsehen: Aus dem CSS lässt sich
 * nicht ablesen, ob ein Text aus seinem Feld läuft. Aus einem Bild schon.
 *
 *   node tools/bilder.mjs                    alle Breiten, alle Screens
 *   node tools/bilder.mjs --breite desktop   nur eine Breite
 *   node tools/bilder.mjs --screen /karte    nur ein Screen
 *   node tools/bilder.mjs --voll             ganze Seite statt nur sichtbar
 *   node tools/bilder.mjs --leer             ohne Prüfbestand, so sieht es
 *                                            beim allerersten Start aus
 *
 * ┌─ Woran das hängt ────────────────────────────────────────────────────────┐
 * │  tools/pruefbestand.mjs   die Daten auf den Bildern                      │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Standardmäßig wird der Prüfbestand eingespielt: Ein leerer Feed zeigt nicht,
 * ob ein Text aus seinem Feld läuft. Mit `--leer` gibt es die andere Hälfte,
 * die leeren Zustände, die echte Menschen am ersten Tag sehen. Beides muss
 * gut aussehen.
 */
const BASE = process.env.BASE ?? 'http://localhost:4173'
const args = process.argv.slice(2)
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null }
const voll = args.includes('--voll')
const leer = args.includes('--leer')
const BESTAND = alsSpeicherstand()

const BREITEN = {
  handy: { width: 390, height: 844 },
  tablet: { width: 834, height: 1112 },
  desktop: { width: 1440, height: 900 },
  breit: { width: 1920, height: 1080 },
}

/*
 * Screen, Adresse, wer angemeldet ist, worauf gewartet wird, und optional
 * etwas, das vorher noch getan werden muss.
 *
 * Der letzte Eintrag ist neu: Aufklappmenüs sieht man sonst nie auf einem
 * Bild, weil sie zu sind, solange niemand darauf tippt. Genau dort steckte
 * aber der Fehler, den die Bilder finden sollten.
 */
const SCREENS = [
  ['start', '/', null, 'main'],
  ['feed', '/feed', 'u1', '.fullheight'],
  ['karte', '/karte', null, '.map-canvas'],
  ['suche', '/suche', null, 'main'],
  ['gastro-seite', '/g/pruef-trattoria', null, 'main'],
  ['osm-betrieb', '/g/marimer', null, 'main'],
  ['speisekarte', '/g/pruef-trattoria/speisekarte', null, 'main'],
  ['bewertungen', '/g/pruef-trattoria/bewertungen', null, 'main'],
  ['code-bestaetigen', '/registrieren', null, 'main'],
  ['profil', '/profil', 'u1', 'main'],
  ['einstellungen', '/einstellungen', 'u1', 'main'],
  ['anmelden', '/anmelden', null, 'main'],
  ['registrieren', '/registrieren', null, 'main'],
  ['gastro-konsole', '/gastro', 'g1', 'main'],
  ['gastro-speisekarte', '/gastro/speisekarte', 'g1', 'main'],
  ['admin', '/admin', 'a1', 'main'],

  /*
   * Die Menüs, aufgeklappt. Das Hamburger-Menü gibt es nur auf schmalen
   * Bildschirmen, am Rechner führt die Kopfleiste selbst. Deshalb `handy`.
   */
  ['menue-kopfleiste', '/anmelden', null, 'main', async (page) => {
    await page.getByRole('button', { name: /Menü/i }).first().click()
    await page.waitForSelector('.dropdown')
  }, 'handy'],
  /* Das Drei-Punkte-Menü auf der Betriebsseite. */
  ['menue-betrieb', '/g/pruef-trattoria', null, 'main', async (page) => {
    await page.getByRole('button', { name: /Mehr/i }).first().click()
    await page.waitForSelector('.dropdown')
  }],

  /* Das Band, wenn kein Server eingestellt ist. Nur in der App sichtbar. */
  ['ohne-server', '/anmelden', null, '.connection-banner', null, 'handy'],

  ['menue-darstellung', '/anmelden', null, 'main', async (page) => {
    await page.getByRole('button', { name: /Darstellung/i }).first().click()
    await page.waitForSelector('.dropdown')
  }],
]

const breiteWahl = flag('--breite')
const screenWahl = flag('--screen')

const ordner = leer ? 'bilder-leer' : 'bilder'
rmSync(ordner, { recursive: true, force: true })
mkdirSync(ordner, { recursive: true })

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const probleme = []

for (const [breitenName, viewport] of Object.entries(BREITEN)) {
  if (breiteWahl && breiteWahl !== breitenName) continue

  for (const [name, pfad, user, warten, vorbereiten, nurBreite] of SCREENS) {
    if (screenWahl && screenWahl !== pfad) continue
    if (nurBreite && nurBreite !== breitenName) continue

    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 })
    await context.addInitScript((state) => {
      localStorage.setItem('app-ui', JSON.stringify({ platform: state.platform ?? 'web', theme: 'light' }))
      if (state.user) localStorage.setItem('app-session', JSON.stringify({ userId: state.user }))
      else localStorage.removeItem('app-session')
      if (state.bestand) localStorage.setItem('app-db', JSON.stringify(state.bestand))
      else localStorage.removeItem('app-db')
    }, { user, bestand: leer ? null : BESTAND, platform: name === 'ohne-server' ? 'app' : 'web' })

    /* Kacheln nicht anfragen, siehe routen-sweep.mjs. */
    await context.route('**/tile.openstreetmap.org/**', (route) => route.abort())

    const page = await context.newPage()
    const fehler = []
    page.on('pageerror', (e) => fehler.push(e.message))
    try {
      await page.goto(`${BASE}${pfad}`, { waitUntil: 'domcontentloaded', timeout: 20000 })
      await page.waitForSelector(warten, { timeout: 15000 })
      if (vorbereiten) await vorbereiten(page)
      await page.waitForTimeout(700)
      await page.screenshot({ path: `${ordner}/${breitenName}-${name}.png`, fullPage: voll })

      /* Waagerechter Überlauf ist immer ein Fehler, nie Absicht. */
      const ueberlauf = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth)
      if (ueberlauf > 1) probleme.push(`${breitenName}/${name}: Seite ist ${ueberlauf}px zu breit`)
      if (fehler.length) probleme.push(`${breitenName}/${name}: ${fehler[0]}`)
    } catch (error) {
      probleme.push(`${breitenName}/${name}: ${error.message.split('\n')[0]}`)
    }
    await context.close()
  }
}

await browser.close()
console.log(`Bilder liegen in ${ordner}/`)
if (probleme.length) {
  console.log('\nAuffälligkeiten:')
  probleme.forEach((p) => console.log(`  ${p}`))
} else {
  console.log('Keine Auffälligkeiten.')
}
