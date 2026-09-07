import { Link } from 'react-router-dom'

/**
 * TEIL A.4 — Button
 * Varianten: primary | secondary | quiet | danger
 * Zustände: normal, hover, aktiv, deaktiviert, ladend
 *
 * `to` macht daraus einen Router-Link, `href` einen normalen Link.
 */
export function Button({
  variant = 'secondary',
  size,
  full,
  loading,
  disabled,
  icon: Icon,
  iconRight: IconRight,
  to,
  href,
  children,
  className = '',
  ...rest
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size === 'sm' && 'btn-sm',
    full && 'btn-full',
    loading && 'btn-loading',
    className,
  ].filter(Boolean).join(' ')

  const content = (
    <>
      {Icon && <Icon size={18} strokeWidth={2} />}
      {children}
      {IconRight && <IconRight size={18} strokeWidth={2} />}
      {loading && <span className="spinner" aria-hidden="true" />}
    </>
  )

  if (to && !disabled) {
    return <Link to={to} className={classes} {...rest}>{content}</Link>
  }
  if (href && !disabled) {
    return <a href={href} className={classes} {...rest}>{content}</a>
  }
  return (
    <button type="button" className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  )
}

/** TEIL A.4 — Symbolbutton, 40 × 40 px, rund. */
export function IconButton({ icon: Icon, label, tone, to, size = 20, className = '', ...rest }) {
  const classes = ['btn', 'btn-icon', tone === 'on-dark' && 'btn-icon-on-dark', tone === 'glass' && 'btn-icon-glass', className]
    .filter(Boolean).join(' ')
  const content = <Icon size={size} strokeWidth={2} />
  if (to) return <Link to={to} className={classes} aria-label={label} title={label} {...rest}>{content}</Link>
  return (
    <button type="button" className={classes} aria-label={label} title={label} {...rest}>
      {content}
    </button>
  )
}
