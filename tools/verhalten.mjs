import { chromium } from 'playwright'

/**
 * Gezielte Verhaltenstests für die Abläufe, die in Runde 5 dazugekommen sind.
 * Erwartet einen laufenden Vorschau-Server auf Port 4173.
 */
const BASE = 'http://localhost:4173'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const TIMEOUT = Number(process.env.PW_TIMEOUT ?? 15000)

const results = []
async function test(name, setup, body) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  /*
   * Läuft vor jedem Seitenaufruf. Die Datenhaltung wird deshalb nur beim
   * ersten Mal geleert — sonst wäre nach jedem Klick auf einen Link alles
   * wieder auf Anfang, und mehrschrittige Abläufe ließen sich nicht prüfen.
   */
  await context.addInitScript((state) => {
    localStorage.setItem('app-ui', JSON.stringify(state.ui))
    if (!sessionStorage.getItem('pruefung-vorbereitet')) {
      if (state.user) localStorage.setItem('app-session', JSON.stringify({ userId: state.user }))
      else localStorage.removeItem('app-session')
      localStorage.removeItem('app-db')
      localStorage.removeItem('app-upload-draft')
      sessionStorage.setItem('pruefung-vorbereitet', '1')
    }
  }, setup)
  const page = await context.newPage()
  page.setDefaultTimeout(TIMEOUT)
  page.setDefaultNavigationTimeout(TIMEOUT)
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  try {
    await body(page)
    if (errors.length) throw new Error(`JS-Fehler: ${errors[0]}`)
    results.push(['ok', name])
  } catch (error) {
    results.push(['FEHLER', `${name} — ${error.message.split('\n')[0]}`])
  }
  await context.close()
}

const web = { ui: { platform: 'web', theme: 'light' }, user: null }
const webUser = { ui: { platform: 'web', theme: 'light' }, user: 'u1' }
const app = { ui: { platform: 'app', theme: 'light' }, user: null }
const appUser = { ui: { platform: 'app', theme: 'light' }, user: 'u1' }
const gastro = { ui: { platform: 'web', theme: 'light' }, user: 'g1' }
const admin = { ui: { platform: 'web', theme: 'light' }, user: 'a1' }

/* --- Anmeldung und Rollen ------------------------------------------------ */

await test('App ohne Anmeldung leitet zur Anmeldeseite', app, async (page) => {
  await page.goto(`${BASE}/feed`)
  await page.waitForURL('**/anmelden')
})

await test('Website als Gast darf die Karte sehen', web, async (page) => {
  await page.goto(`${BASE}/karte`)
  await page.waitForSelector('.map-canvas')
})

await test('Anmelden mit falschem Passwort zeigt eine Fehlermeldung', web, async (page) => {
  await page.goto(`${BASE}/anmelden`)
  await page.fill('input[autocomplete="username"]', 'max@beispiel.de')
  await page.fill('input[type="password"]', 'falsch')
  await page.click('button[type="submit"]')
  await page.waitForSelector('.notice-danger')
})

await test('Anmelden als Nutzer führt in den Feed', web, async (page) => {
  await page.goto(`${BASE}/anmelden`)
  await page.fill('input[autocomplete="username"]', 'max@beispiel.de')
  await page.fill('input[type="password"]', 'Passwort123')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/feed')
})

await test('Anmelden als Admin führt in den Admin-Bereich', web, async (page) => {
  await page.goto(`${BASE}/anmelden`)
  await page.fill('input[autocomplete="username"]', 'ana@intern')
  await page.fill('input[type="password"]', 'Admin1234')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/admin')
})

await test('Gastro-Erstlogin erzwingt ein neues Passwort', web, async (page) => {
  await page.goto(`${BASE}/gastro/anmelden`)
  await page.fill('input[type="email"]', 'hallo@morgenrot-cafe.de')
  await page.fill('input[type="password"]', 'Start1234')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/gastro/willkommen')
  /* Und man kommt dort nicht weg, bevor es gesetzt ist. */
  await page.goto(`${BASE}/gastro`)
  await page.waitForURL('**/gastro/willkommen')
})

await test('Nutzer ohne Admin-Rechte bekommt 403', webUser, async (page) => {
  await page.goto(`${BASE}/admin`)
  await page.waitForURL('**/403')
})

await test('Abmelden führt zur Anmeldeseite', appUser, async (page) => {
  await page.goto(`${BASE}/einstellungen`)
  await page.getByRole('button', { name: /Abmelden/ }).first().click()
  await page.waitForURL('**/anmelden')
})

/* --- Registrierung ------------------------------------------------------- */

await test('Registrierung prüft Pflichtfelder', web, async (page) => {
  await page.goto(`${BASE}/registrieren`)
  await page.click('button[type="submit"]')
  const errors = await page.locator('.field-error').count()
  if (errors < 3) throw new Error(`nur ${errors} Fehlermeldungen`)
})

await test('Registrierung lehnt unter 16-Jährige ab', web, async (page) => {
  await page.goto(`${BASE}/registrieren`)
  await page.fill('input[type="email"]', 'neu@beispiel.de')
  await page.fill('input[placeholder="151 23456789"]', '15123456789')
  await page.fill('input[placeholder="deinname"]', 'neuling')
  await page.fill('input[type="password"]', 'Passwort123')
  const selects = page.locator('select')
  await selects.nth(1).selectOption('1')
  await selects.nth(2).selectOption('Dezember')
  await selects.nth(3).selectOption('2010')
  await page.locator('.check input[type="checkbox"]').nth(0).check()
  await page.locator('.check input[type="checkbox"]').nth(1).check()
  await page.click('button[type="submit"]')
  await page.waitForSelector('.field-error')
})

/* --- Dunkelmodus --------------------------------------------------------- */

await test('Dunkelmodus lässt sich auf der Website einschalten', web, async (page) => {
  await page.goto(`${BASE}/`)
  await page.getByRole('button', { name: /Darstellung wechseln/ }).first().click()
  await page.getByRole('menuitem', { name: 'Dunkel' }).or(page.locator('.menu-item', { hasText: 'Dunkel' })).first().click()
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark')
})

await test('Dunkelmodus ist in der App ohne Anmeldung erreichbar', app, async (page) => {
  await page.goto(`${BASE}/anmelden`)
  await page.getByRole('button', { name: /Darstellung wechseln/ }).first().click()
  await page.locator('.menu-item', { hasText: 'Dunkel' }).first().click()
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark')
})

/* --- Karte --------------------------------------------------------------- */

await test('Reine Kartenansicht blendet die Leisten aus', appUser, async (page) => {
  await page.goto(`${BASE}/karte`)
  await page.waitForSelector('.bottom-nav')
  await page.locator('.map-tools .map-tool').first().click()
  await page.waitForSelector('.bottom-nav', { state: 'detached' })
  await page.waitForSelector('.header', { state: 'detached' })
  await page.waitForSelector('.map-canvas')
})

await test('Angebotsfilter reduziert die Treffer', webUser, async (page) => {
  await page.goto(`${BASE}/karte`)
  await page.waitForSelector('.bottom-sheet .place-row')
  const before = await page.locator('.bottom-sheet .place-row').count()
  await page.locator('.chip-scroll button', { hasText: 'Angebot' }).first().click()
  await page.locator('.menu .chip', { hasText: 'Meeresfrüchte' }).first().click()
  await page.locator('.menu-actions button', { hasText: 'Anwenden' }).click()
  await page.waitForTimeout(600)
  const after = await page.locator('.bottom-sheet .place-row').count()
  if (!(after < before)) throw new Error(`vorher ${before}, nachher ${after}`)
})

await test('Angebot steht in der Trefferliste', webUser, async (page) => {
  await page.goto(`${BASE}/karte`)
  await page.waitForSelector('.bottom-sheet .place-row .serving-row')
})

/* --- Speisekarte --------------------------------------------------------- */

await test('Speisekarte lädt ohne App-Rahmen', web, async (page) => {
  await page.goto(`${BASE}/g/trattoria-bella/speisekarte`)
  await page.waitForSelector('.menu-item-name')
  if (await page.locator('.bottom-nav').count()) throw new Error('untere Leiste sichtbar')
  if (await page.locator('footer.footer').count()) throw new Error('Website-Fußzeile sichtbar')
})

await test('Suche auf der Speisekarte filtert', web, async (page) => {
  await page.goto(`${BASE}/g/trattoria-bella/speisekarte`)
  await page.waitForSelector('.menu-item-name')
  const before = await page.locator('.menu-item').count()
  await page.fill('.menu-search input', 'Pizza')
  await page.waitForTimeout(300)
  const after = await page.locator('.menu-item').count()
  if (!(after < before)) throw new Error(`vorher ${before}, nachher ${after}`)
})

await test('Allergenlegende zeigt nur vorkommende Allergene', web, async (page) => {
  await page.goto(`${BASE}/g/trattoria-bella/speisekarte`)
  await page.waitForSelector('.menu-legend')
  const count = await page.locator('.menu-legend li').count()
  if (count === 0 || count > 10) throw new Error(`${count} Einträge`)
})

await test('Gastro legt ein Gericht an, es steht auf der Karte', gastro, async (page) => {
  await page.goto(`${BASE}/gastro/speisekarte`)
  await page.waitForSelector('.list-row')
  await page.locator('button', { hasText: 'Gericht hinzufügen' }).first().click()
  await page.waitForSelector('.modal')
  await page.locator('.modal .field input').first().fill('Testgericht Ravioli')
  await page.locator('.modal .input-affix input').first().fill('11,50')
  await page.locator('.modal-actions button', { hasText: 'Speichern' }).click()
  await page.waitForSelector('.modal', { state: 'detached' })
  await page.goto(`${BASE}/g/trattoria-bella/speisekarte`)
  await page.waitForSelector('text=Testgericht Ravioli')
})

/* --- Feed und Beiträge --------------------------------------------------- */

await test('Gast im Feed bekommt beim Liken den Anmeldehinweis', web, async (page) => {
  await page.goto(`${BASE}/feed`)
  await page.waitForSelector('.feed-rail')
  await page.getByRole('button', { name: 'Gefällt mir' }).click()
  await page.waitForSelector('.modal')
})

await test('Angemeldet liken zählt die Zahl hoch', webUser, async (page) => {
  await page.goto(`${BASE}/feed`)
  await page.waitForSelector('.feed-rail .count')
  const before = Number(await page.locator('.feed-rail .count').first().innerText())
  await page.getByRole('button', { name: 'Gefällt mir' }).click()
  await page.waitForTimeout(800)
  const after = Number(await page.locator('.feed-rail .count').first().innerText())
  if (after !== before + 1) throw new Error(`${before} → ${after}`)
})

/* --- Upload -------------------------------------------------------------- */

await test('Upload-Schritt ohne Video leitet zurück', appUser, async (page) => {
  await page.goto(`${BASE}/upload/bewertung`)
  await page.waitForURL('**/upload')
})

await test('Video hochladen landet in der Admin-Warteschlange', appUser, async (page) => {
  await page.goto(`${BASE}/upload`)
  await page.locator('button', { hasText: 'Hochladen' }).first().click()
  await page.waitForURL('**/upload/bearbeiten')
  await page.locator('button', { hasText: 'Weiter' }).click()
  await page.waitForURL('**/upload/restaurant')
  await page.waitForSelector('input[name="place"]')
  await page.locator('input[name="place"]').first().check()
  await page.locator('button', { hasText: 'Weiter' }).click()
  await page.waitForURL('**/upload/bewertung')
  await page.locator('button', { hasText: 'Weiter' }).click()
  await page.waitForURL('**/upload/veroeffentlichen')
  await page.locator('textarea').first().fill('Testvideo aus dem Prüflauf')
  await page.locator('button', { hasText: 'Veröffentlichen' }).click()
  await page.waitForSelector('.empty-state')

  /* Jetzt als Admin nachsehen. */
  await page.evaluate(() => localStorage.setItem('app-session', JSON.stringify({ userId: 'a1' })))
  await page.goto(`${BASE}/admin/videos`)
  await page.waitForSelector('.list-row')
})

/* --- Admin --------------------------------------------------------------- */

await test('Admin gibt ein Video frei, die Warteschlange schrumpft', admin, async (page) => {
  await page.goto(`${BASE}/admin/videos`)
  await page.waitForSelector('.list-row')
  const before = await page.locator('.list-row').count()
  await page.locator('button', { hasText: 'Freigeben' }).click()
  await page.waitForTimeout(600)
  const after = await page.locator('.list-row').count()
  if (after !== before - 1) throw new Error(`${before} → ${after}`)
})

await test('Meldung eines Betriebs erscheint bei der Moderation', webUser, async (page) => {
  await page.goto(`${BASE}/g/baeckerei-sommer`)
  await page.locator('.tabs button', { hasText: 'Infos' }).first().click()
  await page.locator('button', { hasText: 'Problem melden' }).click()
  await page.waitForSelector('.modal')
  await page.locator('.modal-actions button').last().click()
  await page.waitForSelector('.modal', { state: 'detached' })

  await page.evaluate(() => localStorage.setItem('app-session', JSON.stringify({ userId: 'a1' })))
  await page.goto(`${BASE}/admin/meldungen`)
  await page.waitForSelector('table tbody tr')
})

/* --- Einstellungen ------------------------------------------------------- */

await test('Profil bearbeiten wird gespeichert', webUser, async (page) => {
  await page.goto(`${BASE}/einstellungen/profil`)
  await page.waitForSelector('form .field input')
  await page.locator('form .field input').first().fill('Max Geändert')
  await page.locator('button[type="submit"]').click()
  await page.waitForURL('**/profil')
  await page.waitForSelector('text=Max Geändert')
})

await test('Profil zeigt beim Laden eine Ladeanzeige', webUser, async (page) => {
  await page.goto(`${BASE}/p/lisa_k`, { waitUntil: 'commit' })
  await page.waitForSelector('.skeleton, .spin-badge', { timeout: 4000 })
})

await browser.close()

const failed = results.filter(([status]) => status !== 'ok')
results.forEach(([status, name]) => console.log(`${status === 'ok' ? '  ok  ' : 'FEHLER'} ${name}`))
console.log(`\n${results.length - failed.length} von ${results.length} bestanden.`)
if (failed.length) process.exitCode = 1
