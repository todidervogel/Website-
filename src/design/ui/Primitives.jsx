import { BadgeCheck, MapPin } from 'lucide-react'
import { t } from '../i18n'

/** Karte — Grundfläche für fast alle Inhalte. */
export function Card({ flat, pad, className = '', children, ...rest }) {
  return (
    <div className={`card ${flat ? 'card-flat' : ''} ${pad === 0 ? 'card-pad-0' : ''} ${className}`} {...rest}>
      {children}
    </div>
  )
}

/** Chip — Filter, Merkmale, Gerichte. */
export function Chip({ active, onClick, icon: Icon, children, className = '', ...rest }) {
  const Tag = onClick ? 'button' : 'span'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`chip ${onClick ? '' : 'chip-static'} ${className}`}
      aria-pressed={onClick ? !!active : undefined}
      data-active={active || undefined}
      onClick={onClick}
      {...rest}
    >
      {Icon && <Icon size={14} />}
      {children}
    </Tag>
  )
}

export function ChipRow({ children, scroll }) {
  return <div className={scroll ? 'chip-scroll' : 'row-wrap'}>{children}</div>
}

/** Badge — kurze Statuslabels in Großbuchstaben. */
export function Badge({ tone = 'default', icon: Icon, children, className = '' }) {
  return (
    <span className={`badge ${tone !== 'default' ? `badge-${tone}` : ''} ${className}`}>
      {Icon && <Icon size={11} />}
      {children}
    </span>
  )
}

/** Blaues Häkchen hinter verifizierten Betriebsnamen. */
export function VerifiedMark({ withLabel }) {
  return withLabel ? (
    <Badge tone="verified" icon={BadgeCheck}>{t('common.verified')}</Badge>
  ) : (
    <BadgeCheck size={16} className="verified-mark" aria-label={t('common.verified')} />
  )
}

/** „VOR ORT“-Badge für GPS-verifizierte Beiträge. */
export function OnSiteBadge({ tone = 'success' }) {
  return <Badge tone={tone} icon={MapPin}>{t('common.onSite')}</Badge>
}

/** Hinweisband. */
export function Notice({ tone, icon: Icon, children, className = '', ...rest }) {
  return (
    <div className={`notice ${tone ? `notice-${tone}` : ''} ${className}`} {...rest}>
      {Icon && <Icon size={18} style={{ flex: 'none', marginTop: 2 }} />}
      <div className="t-small">{children}</div>
    </div>
  )
}

/** Avatar — rund, mit Initiale als Platzhalter. */
export function Avatar({ name = '?', size = 40, src }) {
  if (src) return <img className="avatar" src={src} alt="" width={size} height={size} style={{ width: size, height: size }} />
  return (
    <span
      className="avatar-placeholder"
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.38) }}
      aria-hidden="true"
    >
      {name.replace('@', '').charAt(0).toUpperCase()}
    </span>
  )
}

/** Bildplatzhalter in der Form des späteren Bildes. */
export function Thumb({ size = 72, width, height, radius, icon: Icon, className = '', children }) {
  return (
    <span
      className={`thumb-placeholder ${className}`}
      style={{
        width: width ?? size,
        height: height ?? size,
        borderRadius: radius ?? 'var(--r-card)',
        position: 'relative',
      }}
    >
      {Icon && <Icon size={Math.min(24, (width ?? size) * 0.34)} />}
      {children}
    </span>
  )
}
