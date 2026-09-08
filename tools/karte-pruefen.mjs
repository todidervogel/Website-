import { kartenblick, kachelAdresse } from '../src/lib/map.js'

/**
 * Prüft die Kartenrechnung mit Zahlen.
 *
 * Die Kacheln von OpenStreetMap sind aus dieser Umgebung nicht erreichbar,
 * also lässt sich nicht ansehen, ob Marker und Karte zusammenpassen. Nachrechnen
 * geht trotzdem, und fängt genau die Fehler, die man sonst erst auf dem Handy
 * sieht: verschobene Marker, falscher Maßstab, verzerrte Höhe.
 */
const ergebnisse = []
const pruefe = (name, ok, hinweis = '') => ergebnisse.push([!!ok, name, ok ? '' : hinweis])
const nah = (a, b, toleranz = 0.5) => Math.abs(a - b) <= toleranz

const mitte = { lat: 52.5390, lng: 13.4116 }   /* Prenzlauer Berg */
const breite = 800
const hoehe = 600
const spanKm = 8

const blick = kartenblick({ center: mitte, spanKm, width: breite, height: hoehe })

pruefe('Ein Blick kommt heraus', !!blick)

const m = blick.projizieren(mitte)
pruefe('Der Mittelpunkt liegt in der Mitte',
  nah(m.left, breite / 2) && nah(m.top, hoehe / 2), `${m.left.toFixed(1)} / ${m.top.toFixed(1)}`)

/* Ein Kilometer nach Osten muss breite/spanKm Pixel nach rechts sein. */
const kmProGrad = 111.32 * Math.cos((mitte.lat * Math.PI) / 180)
const einKmOst = blick.projizieren({ lat: mitte.lat, lng: mitte.lng + 1 / kmProGrad })
pruefe('Ein Kilometer nach Osten stimmt im Maßstab',
  nah(einKmOst.left - breite / 2, breite / spanKm, 1),
  `${(einKmOst.left - breite / 2).toFixed(1)} statt ${(breite / spanKm).toFixed(1)}`)

/*
 * Der wichtigste Test. Ein Kilometer nach Norden muss genauso viele Pixel
 * sein wie ein Kilometer nach Osten, sonst ist die Karte verzerrt, und genau
 * das war der alte Fehler: Die Höhe nahm denselben Maßstab wie die Breite,
 * ohne die Höhe des Kastens zu berücksichtigen.
 */
const einKmNord = blick.projizieren({ lat: mitte.lat + 1 / 111.32, lng: mitte.lng })
pruefe('Ein Kilometer nach Norden ist genauso lang wie nach Osten',
  nah(hoehe / 2 - einKmNord.top, einKmOst.left - breite / 2, 1),
  `${(hoehe / 2 - einKmNord.top).toFixed(1)} gegen ${(einKmOst.left - breite / 2).toFixed(1)}`)

/* Norden ist oben. */
pruefe('Norden liegt oben', einKmNord.top < hoehe / 2)
pruefe('Osten liegt rechts', einKmOst.left > breite / 2)

/* Kacheln müssen den Kasten lückenlos abdecken. */
pruefe('Kacheln decken den Kasten ab', blick.kacheln.length > 0, `${blick.kacheln.length}`)
const linksAussen = Math.min(...blick.kacheln.map((k) => k.left))
const rechtsAussen = Math.max(...blick.kacheln.map((k) => k.left + k.groesse))
const obenAussen = Math.min(...blick.kacheln.map((k) => k.top))
const untenAussen = Math.max(...blick.kacheln.map((k) => k.top + k.groesse))
pruefe('Keine Lücke am Rand',
  linksAussen <= 0 && obenAussen <= 0 && rechtsAussen >= breite && untenAussen >= hoehe,
  `${linksAussen.toFixed(0)} ${obenAussen.toFixed(0)} ${rechtsAussen.toFixed(0)} ${untenAussen.toFixed(0)}`)

/* Zoomstufen bleiben im erlaubten Bereich, egal wie weit der Umkreis. */
for (const km of [0.5, 2, 8, 30, 200, 2000]) {
  const b = kartenblick({ center: mitte, spanKm: km, width: breite, height: hoehe })
  pruefe(`Zoomstufe bei ${km} km ist gültig`, b.zoom >= 1 && b.zoom <= 19, `z=${b.zoom}`)
}

/* Kachelnummern dürfen nie aus dem Gültigen laufen. */
const alleGueltig = blick.kacheln.every((k) => k.x >= 0 && k.x < 2 ** k.zoom && k.y >= 0 && k.y < 2 ** k.zoom)
pruefe('Alle Kachelnummern liegen im Gültigen', alleGueltig)

pruefe('Adresse sieht aus wie eine Kachel',
  /^https:\/\/tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png$/.test(kachelAdresse(blick.kacheln[0])),
  kachelAdresse(blick.kacheln[0]))

pruefe('Mit Server laufen die Kacheln über den Server',
  kachelAdresse(blick.kacheln[0], 'https://beispiel.test')
    .startsWith('https://beispiel.test/api/karte/kachel/'),
  kachelAdresse(blick.kacheln[0], 'https://beispiel.test'))

/* Auch ein sehr breiter Kasten darf nicht verzerren. */
const breitesBild = kartenblick({ center: mitte, spanKm, width: 1600, height: 300 })
const o2 = breitesBild.projizieren({ lat: mitte.lat, lng: mitte.lng + 1 / kmProGrad })
const n2 = breitesBild.projizieren({ lat: mitte.lat + 1 / 111.32, lng: mitte.lng })
pruefe('Auch im breiten Kasten bleibt der Maßstab gleich',
  nah(150 - n2.top, o2.left - 800, 1), `${(150 - n2.top).toFixed(1)} gegen ${(o2.left - 800).toFixed(1)}`)

const durchgefallen = ergebnisse.filter(([ok]) => !ok)
ergebnisse.forEach(([ok, name, hinweis]) =>
  console.log(`${ok ? '  ok  ' : 'FEHLER'} ${name}${hinweis ? `, ${hinweis}` : ''}`))
console.log(`\n${ergebnisse.length - durchgefallen.length} von ${ergebnisse.length} bestanden.`)
if (durchgefallen.length) process.exitCode = 1
