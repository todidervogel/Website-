import { chromium } from 'playwright'

/**
 * Prüft die Website im Serverbetrieb.
 *
 * Voraussetzung: Der Server läuft (Repo `Server`, `npm start`) und die
 * Website wurde mit VITE_API dagegen gebaut und ausgeliefert.
 *
 *   npm start                              (im Server-Repo)
 *   VITE_API=http://localhost:4000 npm run build
 *   npx vite preview --port 4174 --strictPort
 *   node tools/gegen-server.mjs
 *
 * Der Unterschied zum Alleinbetrieb: Die Daten liegen woanders, die Rechte
 * hängen am Server, und zwei Browser sehen denselben Stand.
 */
const WEB = process.env.WEB ?? 'http://localhost:4174'
const API = process.env.API ?? 'http://localhost:4000'

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME ?? '/opt/pw-browsers/chromium' })
const results = []
const check = (name, ok, detail = '') => results.push([!!ok, name, ok ? '' : detail])

async function seite(platform = 'web') {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  /* Läuft vor jedem Seitenaufruf, deshalb nur beim ersten Mal aufräumen,
     sonst wäre das Zugangsmerkmal nach jedem Link wieder weg. */
  await ctx.addInitScript((p) => {
    localStorage.setItem('app-ui', JSON.stringify({ platform: p, theme: 'light' }))
    if (!sessionStorage.getItem('vorbereitet')) {
      localStorage.removeItem('app-token')
      localStorage.removeItem('app-session')
      sessionStorage.setItem('vorbereitet', '1')
    }
  }, platform)
  const page = await ctx.newPage()
  page.setDefaultTimeout(20000)
  return { page, ctx }
}

const anmelden = async (page, email, passwort) => {
  await page.goto(`${WEB}/anmelden`)
  await page.fill('input[autocomplete="username"]', email)
  await page.fill('input[type="password"]', passwort)
  await page.click('button[type="submit"]')
}

/* Vor dem Lauf auf den Auslieferungsstand zurück. */
await fetch(`${API}/api/reset`, { method: 'POST' }).catch(() => {})

/* --- Die Website spricht wirklich mit dem Server ------------------------- */
{
  const { page, ctx } = await seite()
  const rufe = []
  page.on('request', (r) => { if (r.url().startsWith(API)) rufe.push(r.url()) })
  await page.goto(`${WEB}/karte`)
  await page.waitForSelector('.bottom-sheet .place-row')
  check('Die Karte holt ihre Daten vom Server', rufe.length > 0, `${rufe.length} Aufrufe`)
  await ctx.close()
}

/* --- Anmeldung läuft über den Server ------------------------------------- */
{
  const { page, ctx } = await seite()
  await anmelden(page, 'max@beispiel.de', 'falsch')
  await page.waitForSelector('.notice-danger')
  check('Falsches Passwort wird abgewiesen', true)

  await page.goto(`${WEB}/anmelden`)
  await anmelden(page, 'max@beispiel.de', 'Passwort123')
  await page.waitForURL('**/feed')
  const token = await page.evaluate(() => localStorage.getItem('app-token'))
  check('Nach der Anmeldung liegt ein Zugangsmerkmal vor', !!token)

  await page.reload()
  await page.waitForURL('**/feed')
  check('Die Sitzung übersteht das Neuladen', await page.evaluate(() => !!localStorage.getItem('app-token')))
  await ctx.close()
}

/* --- Rechte hängen am Server -------------------------------------------- */
{
  const { page, ctx } = await seite()
  await anmelden(page, 'max@beispiel.de', 'Passwort123')
  await page.waitForURL('**/feed')

  /* Ein Nutzer versucht, an der Aufrufliste vorbei ein Video freizugeben. */
  const antwort = await page.evaluate(async (api) => {
    const res = await fetch(`${api}/api/rpc`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${localStorage.getItem('app-token')}` },
      body: JSON.stringify({ method: 'videos.moderate', args: ['v4', 'published'] }),
    })
    return res.status
  }, API)
  check('Der Server weist die Freigabe durch einen Nutzer ab', antwort === 403, `Status ${antwort}`)
  await ctx.close()
}

/* --- Zwei Browser sehen denselben Stand ---------------------------------- */
{
  const a = await seite()
  const b = await seite()

  await anmelden(a.page, 'chef@trattoria-bella.de', 'Gastro123')
  await a.page.waitForURL('**/gastro')
  await a.page.goto(`${WEB}/gastro/speisekarte`)
  await a.page.waitForSelector('.list-row')
  await a.page.locator('button', { hasText: 'Gericht hinzufügen' }).first().click()
  await a.page.waitForSelector('.modal')
  await a.page.locator('.modal .field input').first().fill('Server-Testgericht')
  await a.page.locator('.modal .input-affix input').first().fill('7,50')
  await a.page.locator('.modal-actions button', { hasText: 'Speichern' }).click()
  await a.page.waitForSelector('.modal', { state: 'detached' })

  /* Der zweite Browser hat nie etwas davon gespeichert, er fragt den Server. */
  await b.page.goto(`${WEB}/g/trattoria-bella/speisekarte`)
  await b.page.waitForSelector('text=Server-Testgericht')
  check('Was der eine anlegt, sieht der andere', true)

  await a.ctx.close()
  await b.ctx.close()
}

/* --- Ein Ablauf über zwei Rollen ---------------------------------------- */
{
  const nutzer = await seite('app')
  await anmelden(nutzer.page, 'max@beispiel.de', 'Passwort123')
  await nutzer.page.waitForURL('**/feed')

  await nutzer.page.goto(`${WEB}/upload`)
  await nutzer.page.locator('button', { hasText: 'Hochladen' }).first().click()
  await nutzer.page.waitForURL('**/upload/bearbeiten')
  await nutzer.page.locator('button', { hasText: 'Weiter' }).click()
  await nutzer.page.waitForURL('**/upload/restaurant')
  await nutzer.page.waitForSelector('input[name="place"]')
  await nutzer.page.locator('input[name="place"]').first().check()
  await nutzer.page.locator('button', { hasText: 'Weiter' }).click()
  await nutzer.page.waitForURL('**/upload/bewertung')
  await nutzer.page.locator('button', { hasText: 'Weiter' }).click()
  await nutzer.page.waitForURL('**/upload/veroeffentlichen')
  await nutzer.page.locator('textarea').first().fill('Über den Server hochgeladen')
  await nutzer.page.locator('button', { hasText: 'Veröffentlichen' }).click()
  await nutzer.page.waitForSelector('.empty-state')

  const admin = await seite()
  await anmelden(admin.page, 'ana@intern', 'Admin1234')
  await admin.page.waitForURL('**/admin')
  await admin.page.goto(`${WEB}/admin/videos`)
  await admin.page.waitForSelector('.list-row')
  const vorher = await admin.page.locator('.list-row').count()
  await admin.page.locator('button', { hasText: 'Freigeben' }).click()
  await admin.page.waitForTimeout(1200)
  const nachher = await admin.page.locator('.list-row').count()
  check('Hochgeladenes Video kommt bei der Verwaltung an und lässt sich freigeben',
    nachher === vorher - 1, `${vorher} → ${nachher}`)

  await nutzer.ctx.close()
  await admin.ctx.close()
}

/* --- Ladezustand --------------------------------------------------------- */

/*
 * Diese Prüfung stand früher in `verhalten.mjs`. Sie hing daran, dass die
 * Fassade im Alleinbetrieb absichtlich verzögerte, ein Entwicklerstück, das
 * mit Runde 8 weggefallen ist. Hier gibt es einen echten Aufruf, und der lässt
 * sich verzögern: Damit wird wirklich geprüft, was gezeigt wird, solange die
 * Daten unterwegs sind.
 */
{
  const { page, ctx } = await seite()
  await ctx.route(`${API}/api/rpc`, async (route) => {
    await new Promise((fertig) => setTimeout(fertig, 600))
    await route.continue()
  })
  try {
    await page.goto(`${WEB}/p/lisa_k`, { waitUntil: 'commit' })
    await page.waitForSelector('.skeleton, .spin-badge, .spinner', { timeout: 8000 })
    check('Während die Daten unterwegs sind, erscheint eine Ladeanzeige', true)
  } catch (fehler) {
    check('Während die Daten unterwegs sind, erscheint eine Ladeanzeige', false,
      fehler.message.split('\n')[0])
  }
  await ctx.close()
}

await browser.close()

const failed = results.filter(([ok]) => !ok)
results.forEach(([ok, name, detail]) => console.log(`${ok ? '  ok  ' : 'FEHLER'} ${name}${detail ? `, ${detail}` : ''}`))
console.log(`\n${results.length - failed.length} von ${results.length} bestanden.`)
if (failed.length) process.exitCode = 1
