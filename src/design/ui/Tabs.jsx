import { useState } from 'react'
import { Lock } from 'lucide-react'

/** Reiter (C.3, C.5, E.7). */
export function Tabs({ items, value, onChange, className = '' }) {
  return (
    <div className={`tabs ${className}`} role="tablist">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          className="tab"
          aria-selected={value === item.id}
          disabled={item.disabled}
          style={item.disabled ? { opacity: 0.4, cursor: 'default' } : undefined}
          onClick={() => !item.disabled && onChange(item.id)}
        >
          {item.label}
          {item.disabled && <Lock size={12} style={{ display: 'inline', marginLeft: 4, verticalAlign: '-1px' }} />}
          {item.count != null && <span className="c-tertiary"> {item.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function useTabs(initial) {
  const [value, setValue] = useState(initial)
  return [value, setValue]
}

/** Ausklappliste (F.13 Häufige Fragen). */
export function Accordion({ items }) {
  const [open, setOpen] = useState(null)
  return (
    <div>
      {items.map((item, i) => (
        <div className="accordion-item" key={i}>
          <button
            type="button"
            className="accordion-trigger"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? null : i)}
          >
            {item.q}
            <span aria-hidden="true" className="c-secondary">{open === i ? '−' : '+'}</span>
          </button>
          {open === i && <div className="accordion-panel t-body">{item.a}</div>}
        </div>
      ))}
    </div>
  )
}
