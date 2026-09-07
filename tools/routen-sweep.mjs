import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

/**
 * Ruft jede Route in mehreren Kombinationen auf und meldet, was auffällt:
 * JavaScript-Fehler, Konsolenfehler, sichtbare Platzhalter, leere Seiten.
 *
 * Erwartet einen laufenden Vorschau-Server (npx vite preview --port 4173).
 */
const BASE = process.env.PW_BASE ?? 'http://localhost:4173'

/*
 * Die Routen kommen direkt aus dem Router. Vorher lagen sie in einer eigenen
 * Tabelle — die gehörte zum Screen-Index, und der ist mit den übrigen
 * Entwicklersachen weggefallen. Eine Liste, die neben dem Router geführt wird,
 * hätte ohnehin irgendwann nicht mehr dazu gepasst.
 */
const src = readFileSync('src/App.jsx', 'utf8')
const paths = [...new Set([...src.matchAll(/path="([^"]+)"/g)].map((m) => m[1]))]
  .filter((p) => p.startsWith('/') && !p.includes('*'))

const CASES = [
  { name: 'Website · Gast · hell', platform: 'web', user: null, theme: 'light' },
  { name: 'Website · Nutzer · dunkel', platform: 'web', user: 'u1', theme: 'dark' },
  { name: 'App · Nutzer · dunkel', platform: 'app', user: 'u1', theme: 'dark' },
  { name: 'App · Gastro · hell', platform: 'app', user: 'g1', theme: 'light' },
  { name: 'Website · Admin · hell', platform: 'web', user: 'a1', theme: 'light' },
]

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME ?? '/opt/pw-browsers/chromium' })
let checked = 0
const problems = []

for (const testCase of CASES) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await context.addInitScript(([platform, theme, user]) => {
    localStorage.setItem('app-ui', JSON.stringify({ platform, theme, buildBanner: true, cookieBanner: false }))
    if (user) localStorage.setItem('app-session', JSON.stringify({ userId: user }))
    else localStorage.removeItem('app-session')
  }, [testCase.platform, testCase.theme, testCase.user])

  /*
   * Kartenkacheln gar nicht erst anfragen. Sie kommen von außen und haben mit
   * dem Programm nichts zu tun; wo der Zugang gesperrt ist, wartet jeder
   * Kartenaufruf sonst auf vierzig Zeitüberschreitungen und der Durchlauf
   * dauert Minuten statt Sekunden. Die Karte fällt dann auf ihren
   * Rasterhintergrund zurück — genau wie ohne Netz auf dem Gerät.
   */
  await context.route('**/tile.openstreetmap.org/**', (route) => route.abort())

  const page = await context.newPage()
  page.setDefaultTimeout(15000)
  let current = ''
  /*
   * Kartenkacheln kommen von außen. Ob sie durchkommen, hängt am Netz der
   * Umgebung und nicht am Programm — hier ist der Zugang zu
   * tile.openstreetmap.org gesperrt. Ein fehlgeschlagener Kachelabruf ist
   * deshalb keine Auffälligkeit; die Karte fällt dann auf ihren
   * Rasterhintergrund zurück, und die Marker sitzen trotzdem richtig.
   */
  const vonAussen = (text) =>
    text.includes('tile.openstreetmap.org')
    || text.includes('ERR_TUNNEL_CONNECTION_FAILED')
    || text.includes('ERR_NAME_NOT_RESOLVED')

  page.on('console', (msg) => {
    /* Fehlende Bilddateien sind im Entwurf normal, alles andere nicht. */
    if (msg.type() === 'error' && !msg.text().includes('404') && !vonAussen(msg.text())) {
      problems.push(`${testCase.name} ${current}: KONSOLE ${msg.text()}`)
    }
  })
  page.on('pageerror', (err) => problems.push(`${testCase.name} ${current}: JS ${err.message.split('\n')[0]}`))

  for (const path of paths) {
    current = path
    await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(700)
    checked += 1

    const body = await page.evaluate(() => document.body.innerText)
    if (/\{\{\w+\}\}/.test(body)) problems.push(`${testCase.name} ${path}: Platzhalter im Text`)
    if (body.trim().length < 20) problems.push(`${testCase.name} ${path}: Seite praktisch leer`)
  }

  await context.close()
}

await browser.close()
console.log(`${checked} Seitenaufrufe geprüft (${paths.length} Routen × ${CASES.length} Kombinationen)`)
if (problems.length === 0) {
  console.log('Keine Auffälligkeiten.')
} else {
  console.log(`\n${problems.length} Auffälligkeiten:`)
  problems.slice(0, 40).forEach((p) => console.log(' -', p))
  process.exitCode = 1
}
