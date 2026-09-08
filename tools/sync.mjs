import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

/**
 * Holt Design-System und Fachlogik aus ihren Repositories.
 *
 * Beide liegen hier als eingespielte Kopie (`src/design`, `src/domain`) und
 * sind mit eingecheckt — damit läuft die Website ohne Netz und ohne weitere
 * Einrichtung. Geändert wird aber immer im Quell-Repository, nie hier.
 *
 *   node tools/sync.mjs design
 *   node tools/sync.mjs domain
 *   node tools/sync.mjs design --from ../design      (lokaler Ordner statt GitHub)
 */

const QUELLEN = {
  design: {
    repo: 'https://github.com/todidervogel/design',
    ziel: 'src/design',
    teile: [
      ['src/ui', 'ui'],
      ['src/styles', 'styles'],
      ['src/i18n', 'i18n'],
      ['src/config.js', 'config.js'],
      ['src/vocabulary.js', 'vocabulary.js'],
    ],
  },
  domain: {
    repo: 'https://github.com/todidervogel/Server',
    ziel: 'src/domain',
    teile: [
      ['src/domain', '.'],
      /*
       * Der ganze Datenordner, nicht einzelne Dateien.
       *
       * Zweimal ist es schon passiert, dass `seed.js` eine neue Nachbardatei
       * bekam (`anreicherung.js`, `zustand.js`) und der Bau der Website an
       * „Could not resolve" abbrach — weil hier eine Zeile fehlte. Eine Liste,
       * die man pflegen muss, wird irgendwann nicht gepflegt.
       */
      ['src/data', '.'],
    ],
    /* Auf dem Server liegt der Ausgangsbestand eine Ebene höher. */
    nacharbeit: (ziel) => {
      const datei = resolve(ziel, 'index.js')
      return datei
    },
  },
}

const [was, ...rest] = process.argv.slice(2)
const quelle = QUELLEN[was]
if (!quelle) {
  console.error(`Unbekannt: ${was}. Möglich sind: ${Object.keys(QUELLEN).join(', ')}`)
  process.exit(1)
}

const fromIndex = rest.indexOf('--from')
const lokal = fromIndex >= 0 ? resolve(rest[fromIndex + 1]) : null

let basis = lokal
let temp = null

if (!basis) {
  temp = resolve('.sync-tmp')
  rmSync(temp, { recursive: true, force: true })
  console.log(`Hole ${quelle.repo} …`)
  execFileSync('git', ['clone', '--depth', '1', quelle.repo, temp], { stdio: 'inherit' })
  basis = temp
}

if (!existsSync(basis)) {
  console.error(`Nicht gefunden: ${basis}`)
  process.exit(1)
}

rmSync(quelle.ziel, { recursive: true, force: true })
mkdirSync(quelle.ziel, { recursive: true })

for (const [von, nach] of quelle.teile) {
  const quellPfad = resolve(basis, von)
  if (!existsSync(quellPfad)) {
    console.error(`Fehlt im Quell-Repository: ${von}`)
    process.exit(1)
  }
  cpSync(quellPfad, resolve(quelle.ziel, nach), { recursive: true })
}

if (temp) rmSync(temp, { recursive: true, force: true })

/* Der Server lädt den Ausgangsbestand aus ../data/seed.js — hier liegt er daneben. */
if (was === 'domain') {
  const { readdirSync, readFileSync, writeFileSync } = await import('node:fs')
  for (const datei of readdirSync(quelle.ziel)) {
    if (!datei.endsWith('.js')) continue
    const pfad = resolve(quelle.ziel, datei)
    const text = readFileSync(pfad, 'utf8')
    const neu = text.replaceAll("../data/seed.js", "./seed.js")
    if (neu !== text) writeFileSync(pfad, neu)
  }
}

console.log(`${was} eingespielt nach ${quelle.ziel}.`)
console.log('Nicht hier ändern — das Original liegt im Quell-Repository.')
