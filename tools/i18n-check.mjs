import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Prüft, ob jeder Aufruf von t(…) einen Text in de.json findet.
 * Braucht keinen Browser und läuft in einer Sekunde.
 *
 * ── Kommentare zählen nicht ───────────────────────────────────────────────
 *
 * Wer in einem Kommentar erklärt, welcher Schlüssel früher einmal falsch war,
 * schreibt ihn dabei hin. Die Prüfung hat das als fehlenden Schlüssel gemeldet
 * und wurde rot, obwohl im Programm alles stimmte.
 *
 * Deshalb werden Kommentare vorher entfernt. Grob, aber ausreichend: Ein
 * Schlüssel steht nie in einem String, der wie ein Kommentar aussieht.
 */

/** Entfernt Block- und Zeilenkommentare. */
const ohneKommentare = (code) => code
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
const dict = JSON.parse(readFileSync('src/design/i18n/de.json', 'utf8'))
const has = (key) => typeof key.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), dict) === 'string'

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (/\.jsx?$/.test(path)) out.push(path)
  }
  return out
}

const missing = []
const dynamic = []
const roots = process.argv.slice(2).length ? process.argv.slice(2) : ['src']

for (const root of roots) {
  for (const file of walk(root)) {
    const code = ohneKommentare(readFileSync(file, 'utf8'))
    for (const match of code.matchAll(/\bt\(\s*'([^']+)'/g)) {
      if (!has(match[1])) missing.push(`${file}: ${match[1]}`)
    }
    for (const match of code.matchAll(/\bt\(\s*`([^`]*\$\{[^`]*)`/g)) {
      const prefix = match[1].split('${')[0]
      if (prefix.includes('.')) {
        const branch = prefix.slice(0, prefix.lastIndexOf('.'))
        const node = branch.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), dict)
        if (node == null || typeof node !== 'object') dynamic.push(`${file}: ${prefix}\${…}`)
      }
    }
  }
}

if (missing.length === 0 && dynamic.length === 0) {
  console.log('Alle Übersetzungsschlüssel vorhanden.')
} else {
  if (missing.length) { console.log(`${missing.length} fehlende Schlüssel:`); missing.forEach((m) => console.log(' -', m)) }
  if (dynamic.length) { console.log(`\n${dynamic.length} fragwürdige Zweige:`); dynamic.forEach((m) => console.log(' -', m)) }
  process.exitCode = 1
}
