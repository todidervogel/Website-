import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, LoaderCircle, X } from 'lucide-react'
import { Button, IconButton } from './Button'
import { t } from '../i18n'

/* ==========================================================================
   TEIL B.8 — Leere Zustände
   Immer nach demselben Muster: Symbol · Überschrift · Erklärtext · optional Button
   ========================================================================== */
export function EmptyState({ icon: Icon, title, text, action, secondaryAction, onDark }) {
  return (
    <div className={`empty-state ${onDark ? 'empty-state-dark' : ''}`}>
      {Icon && <Icon size={48} strokeWidth={1.5} className="empty-icon" />}
      <h3 className={`t-h3 ${onDark ? 'c-on-dark' : ''}`}>{title}</h3>
      {text && <p className={`t-body ${onDark ? 'c-on-dark-dim' : 'c-secondary'}`}>{text}</p>}
      {(action || secondaryAction) && (
        <div className="row-wrap" style={{ justifyContent: 'center', marginTop: 'var(--sp-2)' }}>
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  )
}

/* ==========================================================================
   TEIL B.9 — Skelettflächen statt Ladekreisel
   ========================================================================== */
export function Skeleton({ w = '100%', h = 12, radius, dark, style, className = '' }) {
  return (
    <span
      className={`skeleton ${dark ? 'skeleton-dark' : ''} ${className}`}
      style={{ display: 'block', width: w, height: h, borderRadius: radius ?? (h <= 20 ? 6 : 'var(--r-card)'), ...style }}
      aria-hidden="true"
    />
  )
}

export function SkeletonText({ lines = 3, widths = ['100%', '92%', '64%'], dark }) {
  return (
    <span style={{ display: 'grid', gap: 8 }} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} w={widths[i % widths.length]} h={12} dark={dark} />
      ))}
    </span>
  )
}

/** Skelett in Form einer Betriebszeile (C.2). */
export function SkeletonRow() {
  return (
    <div className="place-row" aria-hidden="true">
      <Skeleton w={72} h={72} radius="var(--r-card)" />
      <div className="grow" style={{ display: 'grid', gap: 8 }}>
        <Skeleton w="55%" h={16} />
        <Skeleton w="40%" h={12} />
        <Skeleton w="70%" h={12} />
      </div>
    </div>
  )
}

/** Skelett in Form einer Videokachel. */
export function SkeletonTile() {
  return <Skeleton h={0} style={{ aspectRatio: '9 / 16', height: 'auto' }} radius="var(--r-card)" />
}

/**
 * Ladekreisel.
 *
 * Skelettflächen bleiben die erste Wahl (B.9) — sie zeigen, wie die Seite
 * gleich aussieht. Wo es nichts zu skizzieren gibt (ein laufender Button,
 * ein Nachladen unter bestehendem Inhalt), ist der Kreisel richtig.
 */
export function Spinner({ size = 20, label, inline, className = '' }) {
  return (
    <span className={`spin-badge ${inline ? 'spin-badge-inline' : ''} ${className}`} role="status" aria-live="polite">
      <LoaderCircle size={size} aria-hidden="true" />
      <span className={label ? 't-small c-secondary' : 'sr-only'}>{label ?? t('common.loadingLabel')}</span>
    </span>
  )
}

/** Ganzflächiger Ladezustand, wenn eine Seite noch gar nichts zeigen kann. */
export function LoadingBlock({ label, minHeight = 200 }) {
  return (
    <div className="loading-block" style={{ minHeight }}>
      <Spinner size={28} label={label ?? t('common.loading')} />
    </div>
  )
}

/* ==========================================================================
   TEIL B.7 — Dialogfenster
   ========================================================================== */
export function Modal({ open, onClose, title, description, children, actions, wide }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={wide ? { maxWidth: 720 } : undefined}>
        <IconButton icon={X} label={t('common.close')} className="modal-close" onClick={onClose} />
        <h2 className="t-h2" style={{ paddingRight: 40 }}>{title}</h2>
        {description && <p className="t-body c-secondary" style={{ marginTop: 'var(--sp-2)' }}>{description}</p>}
        {children && <div style={{ marginTop: 'var(--sp-4)' }}>{children}</div>}
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  )
}

/** Standard-Buttonzeile: Sekundär „Abbrechen“ links, Primär rechts. */
export function ModalActions({ onCancel, cancelLabel = t('common.cancel'), children }) {
  return (
    <>
      <Button variant="secondary" onClick={onCancel}>{cancelLabel}</Button>
      {children}
    </>
  )
}

/* ==========================================================================
   TEIL B.6 — Toast-Meldungen
   ========================================================================== */
const ToastContext = createContext(() => {})
export const useToast = () => useContext(ToastContext)

const icons = { success: CheckCircle2, error: AlertCircle, info: Info }

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])

  const push = useCallback((text, tone = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setItems((list) => [...list, { id, text, tone }])
    setTimeout(() => setItems((list) => list.filter((i) => i.id !== id)), 3000)
  }, [])

  const value = useMemo(() => push, [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {items.map((item) => {
          const Icon = icons[item.tone] ?? Info
          return (
            <div key={item.id} className={`toast toast-${item.tone}`}>
              <Icon size={18} className="toast-icon" />
              <span className="t-body">{item.text}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
