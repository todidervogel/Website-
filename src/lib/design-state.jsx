import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { HOME_POSITION } from '../domain/seed'
import { letzterStandort, standortErlaubnis, standortHolen } from './standort'
import { DEFAULT_RADIUS } from '../design/config'

/**
 * Zustand der Oberfläche, alles, was nicht in der Datenhaltung steht.
 *
 *  platform  'web' | 'app'     Website im Browser oder verpackte App
 *  device    'mobile' | 'desktop'
 *  theme     'auto' | 'light' | 'dark'   (jetzt auf beiden Zielen)
 *  pureMap   Vollbildkarte ohne Leisten
 *  position  wo der Mensch ist, aus dem Gerät oder ersatzweise die Vorgabe
 *  radiusKm  eingestellter Umkreis
 */
const DesignStateContext = createContext(null)

function detectPlatform() {
  try {
    return Capacitor.isNativePlatform() ? 'app' : 'web'
  } catch {
    return 'web'
  }
}

function detectDevice() {
  if (typeof window === 'undefined') return 'desktop'
  const ua = navigator.userAgent || ''
  const mobileOs = /Android|iPhone|iPad|iPod/i.test(ua)
  const narrow = window.matchMedia('(max-width: 1023px)').matches
  return mobileOs || narrow ? 'mobile' : 'desktop'
}

function detectOs() {
  if (typeof window === 'undefined') return 'unknown'
  const ua = navigator.userAgent || ''
  if (/Android/i.test(ua)) return 'android'
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  return 'desktop'
}

const STORE_KEY = 'app-ui'

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) ?? {}
  } catch {
    return {}
  }
}

function writeStore(value) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(value))
  } catch {
    /* Privater Modus, dann eben ohne Gedächtnis. */
  }
}

const systemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches

export function DesignStateProvider({ children }) {
  const stored = readStore()

  const [platform, setPlatform] = useState(
    detectPlatform() === 'app' ? 'app' : stored.platform ?? 'web',
  )
  const [device, setDevice] = useState(detectDevice)
  const [os] = useState(detectOs)

  /**
   * Der Dunkelmodus gilt für Website und App. „Automatisch" folgt dem
   * Betriebssystem, damit ist er auch dann richtig eingestellt, wenn man
   * ihn nirgends anfasst.
   */
  const [theme, setTheme] = useState(stored.theme ?? 'auto')
  const [systemDark, setSystemDark] = useState(systemPrefersDark)
  const darkMode = theme === 'dark' || (theme === 'auto' && systemDark)

  const [pureMap, setPureMap] = useState(stored.pureMap ?? false)
  /*
   * ┌─ Woher die Position kommt ─────────────────────────────────────────────┐
   * │  1. der letzte bekannte Standort aus dem Gerät (src/lib/standort.js)   │
   * │  2. was zuletzt eingestellt war                                        │
   * │  3. Oberkirch, die Vorgabe aus dem Bestand                             │
   * └────────────────────────────────────────────────────────────────────────┘
   *
   * Vorher stand hier immer Oberkirch. Für jeden, der woanders wohnt, war die
   * App damit leer, ohne dass es einen Hinweis darauf gab.
   */
  const [position, setPosition] = useState(() => letzterStandort() ?? stored.position ?? HOME_POSITION)
  const [positionQuelle, setPositionQuelle] = useState(() => (letzterStandort() ? 'gemerkt' : 'vorgabe'))
  const [standortLaeuft, setStandortLaeuft] = useState(false)
  const [radiusKm, setRadiusKm] = useState(stored.radiusKm ?? DEFAULT_RADIUS)

  const [cookieBanner, setCookieBanner] = useState(stored.cookieBanner ?? false)

  useEffect(() => {
    writeStore({ platform, theme, pureMap, position, radiusKm, cookieBanner })
  }, [platform, theme, pureMap, position, radiusKm, cookieBanner])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const onChange = () => setDevice(detectDevice())
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', darkMode ? '#131316' : '#FFFFFF')
  }, [darkMode])

  /**
   * Den Standort holen und übernehmen.
   *
   * Gibt das Ergebnis zurück, damit die Oberfläche eine Meldung zeigen kann.
   * Wird abgelehnt, bleibt die bisherige Position stehen: eine Karte, die
   * plötzlich ins Nichts springt, wäre schlechter als eine ungenaue.
   */
  const standortAktualisieren = useCallback(async (optionen) => {
    setStandortLaeuft(true)
    const ergebnis = await standortHolen(optionen)
    setStandortLaeuft(false)
    if (ergebnis.ok) {
      setPosition(ergebnis.ort)
      setPositionQuelle('geraet')
    }
    return ergebnis
  }, [])

  /*
   * In der App einmal beim Start fragen. Auf der Webseite nur dann, wenn die
   * Erlaubnis schon erteilt ist: Ein Dialog, der ungefragt aufspringt, kaum
   * dass die Seite offen ist, wird weggeklickt und ist danach für immer
   * abgelehnt. In der App ist die Frage erwartbar, dort ist der Standort der
   * Sinn der Sache.
   */
  useEffect(() => {
    let abgebrochen = false
    const versuchen = async () => {
      if (platform !== 'app' && (await standortErlaubnis()) !== 'granted') return
      if (abgebrochen) return
      standortAktualisieren({ genau: false })
    }
    versuchen()
    return () => { abgebrochen = true }
  }, [platform, standortAktualisieren])

  const value = useMemo(
    () => ({
      platform, isApp: platform === 'app', isWeb: platform === 'web',
      device, setDevice, isMobile: device === 'mobile', isDesktop: device === 'desktop', os,
      theme, setTheme, darkMode,
      pureMap, setPureMap,
      position, setPosition, positionQuelle, standortAktualisieren, standortLaeuft,
      radiusKm, setRadiusKm,
      cookieBanner, setCookieBanner,
    }),
    [platform, device, os, theme, darkMode, pureMap, position, positionQuelle, standortLaeuft,
     standortAktualisieren, radiusKm, cookieBanner],
  )

  return <DesignStateContext.Provider value={value}>{children}</DesignStateContext.Provider>
}

export function useDesignState() {
  const ctx = useContext(DesignStateContext)
  if (!ctx) throw new Error('useDesignState außerhalb des DesignStateProvider')
  return ctx
}

