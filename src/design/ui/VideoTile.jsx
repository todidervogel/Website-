import { Link } from 'react-router-dom'
import { Clock, Lock, Play } from 'lucide-react'
import { Avatar, Badge } from './Primitives'
import { t } from '../i18n'

/**
 * Videokachel, Hochformat 9:16.
 * Verwendung: Startseite (C.1), Gastro-Videos (C.3), Profil (E.7), Gastro-Dashboard (F.4).
 */
export function VideoTile({
  to = '/v/v1',
  title,
  subtitle,
  views,
  author,
  locked,
  pending,
  badge,
  overlayTop,
  width,
}) {
  return (
    <Link to={to} className="video-tile" style={width ? { width } : undefined}>
      <span className="video-tile-top">
        {badge ?? (pending ? <Badge tone="dark" icon={Clock}>{t('gastro.videos.statusPending')}</Badge> : <span />)}
        {locked && <Lock size={14} color="#fff" />}
        {author && <Avatar name={author} size={24} />}
        {overlayTop}
      </span>
      <span className="video-tile-body">
        {title && <span className="t-body-bold c-on-dark truncate" style={{ display: 'block' }}>{title}</span>}
        {subtitle && <span className="t-small c-on-dark-dim">{subtitle}</span>}
        {views && (
          <span className="t-small c-on-dark row" style={{ gap: 4 }}>
            <Play size={12} fill="#fff" strokeWidth={0} /> {views}
          </span>
        )}
      </span>
    </Link>
  )
}
