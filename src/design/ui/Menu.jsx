import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

/** Aufklappmenü, Grundlage für Avatar-Menü, Filter, Drei-Punkte-Menüs. */
export function Menu({ trigger, align = 'left', children, dark, width }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <span className="dropdown-anchor" ref={ref}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div className={`dropdown dropdown-${align} ${dark ? 'sheet-dark' : ''}`} style={width ? { width } : undefined}>
          {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
        </div>
      )}
    </span>
  )
}

export function MenuItem({ icon: Icon, danger, children, ...rest }) {
  return (
    <button type="button" className={`dropdown-item ${danger ? 'dropdown-item-danger' : ''}`} {...rest}>
      {Icon && <Icon size={16} />}
      {children}
    </button>
  )
}

export const MenuSeparator = () => <div className="dropdown-sep" />

/** Filterchip, der ein Menü öffnet (C.2). */
export function FilterChip({ label, active, children, align = 'left', width }) {
  return (
    <Menu
      align={align}
      width={width}
      trigger={({ toggle, open }) => (
        <button type="button" className="chip" aria-pressed={active} aria-expanded={open} onClick={toggle}>
          {label}
          <ChevronDown size={14} />
        </button>
      )}
    >
      {children}
    </Menu>
  )
}
