import { useId, useState } from 'react'
import { Eye, EyeOff, Minus, Plus, Upload } from 'lucide-react'
import { t } from '../i18n'

/**
 * TEIL A.5 — Eingabefeld-Rahmen.
 * Label immer über dem Feld, Pflichtfeld mit *, Hilfetext und Fehlertext darunter.
 * Es findet KEINE Validierung statt — `error` wird von außen gesetzt, damit die
 * Fehlervariante im Design sichtbar gemacht werden kann.
 */
export function Field({ label, required, hint, error, count, children, className = '' }) {
  const id = useId()
  const child = typeof children === 'function' ? children(id) : children
  return (
    <div className={`field ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <label className="field-label" htmlFor={id}>
          {label}
          {required && <span className="field-required" title={t('common.requiredMark')}>*</span>}
        </label>
      )}
      {child}
      {error && <p className="field-error">{error}</p>}
      {hint && !error && <p className="field-hint">{hint}</p>}
      {count && <p className="field-count">{count}</p>}
    </div>
  )
}

export function Input({ className = '', ...rest }) {
  return <input className={`input ${className}`} {...rest} />
}

export function Textarea({ rows = 3, className = '', ...rest }) {
  return <textarea rows={rows} className={`textarea ${className}`} {...rest} />
}

export function Select({ options = [], placeholder, className = '', ...rest }) {
  return (
    <select className={`select ${className}`} defaultValue="" {...rest}>
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  )
}

/** Feld mit Präfix (@, +49) oder Suffix (€). */
export function AffixInput({ prefix, suffix, prefixSelect, className = '', ...rest }) {
  return (
    <div className={`input-affix ${className}`}>
      {prefixSelect && (
        <select className="select affix-select" defaultValue={prefixSelect[0]} aria-label="Ländervorwahl">
          {prefixSelect.map((v) => <option key={v}>{v}</option>)}
        </select>
      )}
      {prefix && <span className="affix">{prefix}</span>}
      <input className="input" {...rest} />
      {suffix && <span className="affix">{suffix}</span>}
    </div>
  )
}

/** Passwortfeld mit Augensymbol (D.1, D.3, D.5). */
export function PasswordInput({ ...rest }) {
  const [shown, setShown] = useState(false)
  return (
    <div className="input-affix">
      <input className="input" type={shown ? 'text' : 'password'} {...rest} />
      <button
        type="button"
        className="btn btn-icon"
        onClick={() => setShown((s) => !s)}
        aria-label={t('auth.register.showPassword')}
      >
        {shown ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}

/** Dreistufige Stärkeanzeige. `level`: 0–3, rein visuell. */
export function StrengthMeter({ level = 2 }) {
  const labels = [null, t('auth.register.strength.weak'), t('auth.register.strength.medium'), t('auth.register.strength.strong')]
  const colors = [null, 'var(--danger)', 'var(--warning)', 'var(--success)']
  return (
    <div className="row" style={{ marginTop: 'var(--sp-2)', gap: 'var(--sp-2)' }}>
      <div className="row grow" style={{ gap: 4 }}>
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            style={{
              height: 4, flex: 1, borderRadius: 'var(--r-pill)',
              background: i <= level ? colors[level] : 'var(--border)',
            }}
          />
        ))}
      </div>
      <span className="t-small c-secondary" style={{ minWidth: 46, textAlign: 'right' }}>{labels[level]}</span>
    </div>
  )
}

export function Checkbox({ label, checked, defaultChecked, onChange, disabled, hint }) {
  return (
    <div>
      <label className="check">
        <input type="checkbox" checked={checked} defaultChecked={defaultChecked} onChange={onChange} disabled={disabled} />
        <span className="check-text">{label}</span>
      </label>
      {hint && <p className="field-hint" style={{ marginLeft: 30 }}>{hint}</p>}
    </div>
  )
}

export function Radio({ label, name, value, checked, onChange, description }) {
  return (
    <label className="radio">
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} />
      <span className="check-text">
        {label}
        {description && <span className="t-small c-secondary" style={{ display: 'block' }}>{description}</span>}
      </span>
    </label>
  )
}

/** Radio als Karte mit Beschreibung (E.6 Sichtbarkeit). */
export function RadioCard({ label, description, name, value, checked, onChange }) {
  return (
    <label className="radio-card" data-selected={checked}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} />
      <span>
        <span className="t-body-bold" style={{ display: 'block' }}>{label}</span>
        {description && <span className="t-small c-secondary">{description}</span>}
      </span>
    </label>
  )
}

/** Schalter (E.10, F.11). */
export function Switch({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="switch"
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
    />
  )
}

/** Zähler mit Minus, Zahl, Plus (E.5). */
export function Stepper({ value, onChange, min = 1, max = 20, placeholder = '–' }) {
  return (
    <div className="stepper">
      <button type="button" aria-label="Weniger" onClick={() => onChange?.(Math.max(min, (value ?? min) - 1))}>
        <Minus size={16} />
      </button>
      <span className="stepper-value">{value ?? placeholder}</span>
      <button type="button" aria-label="Mehr" onClick={() => onChange?.(Math.min(max, (value ?? min - 1) + 1))}>
        <Plus size={16} />
      </button>
    </div>
  )
}

/** Ablagefläche für Dateien (F.3, F.5, F.6, F.8). */
export function Dropzone({ icon: Icon = Upload, text, chooseText = t('gastro.setup.dropChoose'), hint, small, onClick }) {
  return (
    <div>
      <button type="button" className={`dropzone ${small ? 'dropzone-sm' : ''}`} onClick={onClick}>
        <Icon size={small ? 20 : 28} />
        <span className="t-body">
          {text} <span className="c-accent" style={{ textDecoration: 'underline' }}>{chooseText}</span>
        </span>
      </button>
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}

/** Zeichenzähler unter mehrzeiligen Feldern. */
export function charCount(value, max) {
  return `${(value ?? '').length}/${max}`
}
