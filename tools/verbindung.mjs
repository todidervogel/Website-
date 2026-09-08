import { chromium } from 'playwright'

/**
 * Prüft, was passiert, wenn der Server wegbricht.
 *
 * Vorher stand in diesem Fall „In deinem Umkreis wurden noch keine Videos
 * hochgeladen“ auf der Seite, eine Aussage über den Inhalt, obwohl gar keine
 * Verbindung zustande kam.
 *
 * Erwartet eine Vorschau auf 4173, gebaut mit VITE_API auf einen laufenden
 * Server:
 *   VITE_API=http://localhost:4000 npm run build
 *   npx vite preview --port 4173 --strictPort
 */
const VORSCHAU = process.env.BASE ?? 'http://localhost:4173'
const SERVER = process.env.VITE_API ?? 'http://localhost:4000'

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
await context.addInitScript(() => localStorage.setItem('app-ui', JSON.stringify({ platform: 'web', theme: 'light' })))

/* Nur die Aufrufe an den Server abschneiden, die Seite selbst muss laden. */
let kappen = false
const host = new URL(SERVER).host
await context.route(`**/${host}/**`, (route) => (kappen ? route.abort('connectionrefused') : route.continue()))

const seite = await context.newPage()
seite.setDefaultTimeout(15000)

const ergebnisse = []
const pruefe = (name, ok, hinweis = '') => ergebnisse.push([!!ok, name, ok ? '' : hinweis])

try {
  await seite.goto(`${VORSCHAU}/karte`, { waitUntil: 'domcontentloaded' })
  await seite.waitForSelector('.place-row')
  const vorher = await seite.locator('.place-row').count()
  pruefe('Mit Server: Betriebe da', vorher > 0, `${vorher}`)
  pruefe('Mit Server: kein Störungsband', (await seite.locator('.connection-banner').count()) === 0)

  kappen = true
  await seite.reload({ waitUntil: 'domcontentloaded' })
  await seite.waitForSelector('.connection-banner')
  pruefe('Ohne Server: Störungsband erscheint', true)

  await seite.locator('.connection-banner button').click()
  await seite.waitForTimeout(1500)
  pruefe('Erneut versuchen ohne Server: Band bleibt',
    (await seite.locator('.connection-banner').count()) === 1)

  kappen = false
  await seite.locator('.connection-banner button').click()
  await seite.waitForSelector('.connection-banner', { state: 'detached' })
  await seite.waitForSelector('.place-row')
  const nachher = await seite.locator('.place-row').count()
  pruefe('Erneut versuchen mit Server: Band weg und Daten da', nachher === vorher, `${nachher} statt ${vorher}`)
} catch (fehler) {
  pruefe('Durchlauf ohne Ausnahme', false, fehler.message.split('\n')[0])
}

await browser.close()

const durchgefallen = ergebnisse.filter(([ok]) => !ok)
ergebnisse.forEach(([ok, name, hinweis]) =>
  console.log(`${ok ? '  ok  ' : 'FEHLER'} ${name}${hinweis ? `, ${hinweis}` : ''}`))
console.log(`\n${ergebnisse.length - durchgefallen.length} von ${ergebnisse.length} bestanden.`)
if (durchgefallen.length) process.exitCode = 1
