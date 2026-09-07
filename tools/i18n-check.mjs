import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Prüft, ob jeder t('…')-Aufruf einen Text in de.json findet.
 * Braucht keinen Browser und läuft in einer Sekunde.
 */
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
    const code = readFileSync(file, 'utf8')
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
