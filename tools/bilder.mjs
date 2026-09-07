import { chromium } from 'playwright'
import { mkdirSync, rmSync } from 'node:fs'

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
 */
const BASE = process.env.BASE ?? 'http://localhost:4173'
const args = process.argv.slice(2)
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null }
const voll = args.includes('--voll')

const BREITEN = {
  handy: { width: 390, height: 844 },
  tablet: { width: 834, height: 1112 },
  desktop: { width: 1440, height: 900 },
  breit: { width: 1920, height: 1080 },
}

/* Screen, Adresse, wer angemeldet ist, worauf gewartet wird */
const SCREENS = [
  ['start', '/', null, 'main'],
  ['feed', '/feed', 'u1', '.fullheight'],
  ['karte', '/karte', null, '.map-canvas'],
  ['suche', '/suchen', null, 'main'],
  ['gastro-seite', '/g/trattoria-bella', null, 'main'],
  ['speisekarte', '/g/trattoria-bella/speisekarte', null, 'main'],
  ['bewertungen', '/g/trattoria-bella/bewertungen', null, 'main'],
  ['profil', '/profil', 'u1', 'main'],
  ['einstellungen', '/einstellungen', 'u1', 'main'],
  ['anmelden', '/anmelden', null, 'main'],
  ['registrieren', '/registrieren', null, 'main'],
  ['gastro-konsole', '/gastro', 'g1', 'main'],
  ['gastro-speisekarte', '/gastro/speisekarte', 'g1', 'main'],
  ['admin', '/admin', 'a1', 'main'],
]

const breiteWahl = flag('--breite')
const screenWahl = flag('--screen')

const ordner = 'bilder'
rmSync(ordner, { recursive: true, force: true })
mkdirSync(ordner, { recursive: true })

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const probleme = []

for (const [breitenName, viewport] of Object.entries(BREITEN)) {
  if (breiteWahl && breiteWahl !== breitenName) continue

  for (const [name, pfad, user, warten] of SCREENS) {
    if (screenWahl && screenWahl !== pfad) continue

    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 })
    await context.addInitScript((state) => {
      localStorage.setItem('app-ui', JSON.stringify({ platform: 'web', theme: 'light' }))
      if (state.user) localStorage.setItem('app-session', JSON.stringify({ userId: state.user }))
      else localStorage.removeItem('app-session')
    }, { user })

    const page = await context.newPage()
    const fehler = []
    page.on('pageerror', (e) => fehler.push(e.message))
    try {
      await page.goto(`${BASE}${pfad}`, { waitUntil: 'domcontentloaded', timeout: 20000 })
      await page.waitForSelector(warten, { timeout: 15000 })
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
