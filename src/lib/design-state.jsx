import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { HOME_POSITION } from '../domain/seed'
import { DEFAULT_RADIUS } from '../design/config'

/**
 * Zustand der Oberfläche — alles, was nicht in der Datenhaltung steht.
 *
 *  platform  'web' | 'app'     Website im Browser oder verpackte App
 *  device    'mobile' | 'desktop'
 *  theme     'auto' | 'light' | 'dark'   (jetzt auf beiden Zielen)
 *  pureMap   Vollbildkarte ohne Leisten
 *  position  aktueller Kartenmittelpunkt (später echtes GPS)
 *  radiusKm  eingestellter Umkreis
 *  state     nur für die Abnahme: gefüllt / leer / ladend erzwingen
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
    /* Privater Modus — dann eben ohne Gedächtnis. */
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
   * Betriebssystem — damit ist er auch dann richtig eingestellt, wenn man
   * ihn nirgends anfasst.
   */
  const [theme, setTheme] = useState(stored.theme ?? 'auto')
  const [systemDark, setSystemDark] = useState(systemPrefersDark)
  const darkMode = theme === 'dark' || (theme === 'auto' && systemDark)

  const [pureMap, setPureMap] = useState(stored.pureMap ?? false)
  const [position, setPosition] = useState(stored.position ?? HOME_POSITION)
  const [radiusKm, setRadiusKm] = useState(stored.radiusKm ?? DEFAULT_RADIUS)

  const [buildBanner, setBuildBanner] = useState(stored.buildBanner ?? true)
  const [cookieBanner, setCookieBanner] = useState(stored.cookieBanner ?? false)
  const [state, setState] = useState('filled')

  useEffect(() => {
    writeStore({ platform, theme, pureMap, position, radiusKm, buildBanner, cookieBanner })
  }, [platform, theme, pureMap, position, radiusKm, buildBanner, cookieBanner])

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

  const value = useMemo(
    () => ({
      platform, setPlatform, isApp: platform === 'app', isWeb: platform === 'web',
      device, setDevice, isMobile: device === 'mobile', isDesktop: device === 'desktop', os,
      theme, setTheme, darkMode,
      pureMap, setPureMap,
      position, setPosition,
      radiusKm, setRadiusKm,
      buildBanner, setBuildBanner,
      cookieBanner, setCookieBanner,
      state, setState,
      isEmpty: state === 'empty', isLoading: state === 'loading', isFilled: state === 'filled',
    }),
    [platform, device, os, theme, darkMode, pureMap, position, radiusKm, buildBanner, cookieBanner, state],
  )

  return <DesignStateContext.Provider value={value}>{children}</DesignStateContext.Provider>
}

export function useDesignState() {
  const ctx = useContext(DesignStateContext)
  if (!ctx) throw new Error('useDesignState außerhalb des DesignStateProvider')
  return ctx
}

/**
 * Legt den Abnahme-Schalter über ein Abfrageergebnis. Im Normalbetrieb
 * („gefüllt") reicht das Ergebnis unverändert durch.
 *
 * Fällt in Schritt 2 zusammen mit dem Design-Panel weg.
 */
export function useVariant(result) {
  const { state } = useDesignState()
  if (state === 'loading') return { ...result, data: Array.isArray(result.data) ? [] : null, loading: true }
  if (state === 'empty') {
    const empty = Array.isArray(result.data) ? [] : result.data && typeof result.data === 'object' ? { ...result.data, items: [] } : null
    return { ...result, data: empty, loading: false }
  }
  return result
}

/** Kurzform, wenn nur die Liste gebraucht wird. */
export function useListQuery(result) {
  const { data, loading, refreshing, reload } = useVariant(result)
  return { items: data ?? [], loading, refreshing, reload }
}
