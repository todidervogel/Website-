import { useState } from 'react'
import { Flag, Pencil, Star, ThumbsUp, Trash2, Video } from 'lucide-react'
import { Avatar, Badge, Card, Chip, OnSiteBadge, Thumb } from './Primitives'
import { Button, IconButton } from './Button'
import { Stars } from './Rating'
import { Textarea, Field, charCount } from './Field'
import { useToast } from './Feedback'
import { groupSizeLabel, t } from '../i18n'

const compact = (rating) => {
  if (!rating) return null
  return (
    <span className="rating-compact">
      {[[t('rating.food'), rating.food], [t('rating.service'), rating.service], [t('rating.price'), rating.price]]
        .map(([label, value], i, arr) => (
          <span key={label} className="rating-item">
            {label} <Star size={12} className="star-filled" strokeWidth={0} style={{ display: 'inline', verticalAlign: '-1px' }} />{value}
            {i < arr.length - 1 && <span className="dot" aria-hidden="true"> ·</span>}
          </span>
        ))}
    </span>
  )
}

/**
 * Bewertungskarte — C.3 (Reiter Bewertungen), C.7, E.7, F.4, F.7.
 *
 * `variant`:
 *   'public'  — öffentliche Ansicht mit „Gefällt mir“ und „Melden“
 *   'own'     — eigenes Profil: Bearbeiten / Löschen
 *   'gastro'  — Gastro-Ansicht: Antworten / Beanstanden
 *
 * Kennt weder Daten noch Anmeldung: Was beim Danke, beim Antworten und beim
 * Löschen passiert, gibt die Anwendung als `onLike`, `onReply` und `onDelete`
 * mit.
 */
export function ReviewCard({ review, variant = 'public', placeName, onReport, onReply, onLike, onDelete }) {
  const toast = useToast()
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  /* Gelöschte Konten bleiben als Bewertung erhalten, aber ohne Namen (Art. 17). */
  const authorName = review.anonymized ? t('review.anonymous') : (review.author?.username ?? '—')
  const rating = review.rating ?? { food: review.ratingFood, service: review.ratingService, price: review.ratingPrice }

  return (
    <Card>
      {placeName && <p className="t-small c-secondary" style={{ marginBottom: 'var(--sp-2)' }}>{placeName}</p>}

      <div className="row" style={{ alignItems: 'flex-start' }}>
        <Avatar name={authorName} size={40} />
        <div className="grow">
          <div className="row" style={{ gap: 'var(--sp-2)' }}>
            <span className="t-body-bold">{review.anonymized ? authorName : `@${authorName}`}</span>
            {review.verifiedOnSite && <OnSiteBadge />}
          </div>
          <span className="t-small c-secondary">{review.createdAt ?? review.date}</span>
        </div>
        {variant === 'own' && (
          <div className="row" style={{ gap: 0 }}>
            <IconButton icon={Pencil} label={t('common.edit')} onClick={() => toast(t('toast.noAction'), 'info')} />
            <IconButton icon={Trash2} label={t('common.delete')} onClick={() => onDelete?.(review)} />
          </div>
        )}
      </div>

      <div style={{ marginTop: 'var(--sp-3)' }} className="stack-2">
        {compact(rating)}

        <p className="t-small c-secondary">
          {groupSizeLabel(review.groupSize)}
          {review.foodHot != null && ` · ${t('place.foodHot')} ${review.foodHot ? '✓' : '✗'}`}
        </p>

        {review.dishes?.length > 0 && (
          <div className="row-wrap">
            {review.dishes.map((d) => (
              <Chip key={d.name}>
                {d.name}
                {(d.rating ?? d.stars) != null && (
                  <>
                    {' '}<Star size={12} className="star-filled" strokeWidth={0} />{d.rating ?? d.stars}
                  </>
                )}
              </Chip>
            ))}
          </div>
        )}

        <div className="row" style={{ alignItems: 'flex-start' }}>
          {(review.videoId || review.hasVideo) && <Thumb width={100} height={178} icon={Video} />}
          <p className="t-body grow">{review.text}</p>
        </div>
      </div>

      {review.answer && (
        <div style={{ marginTop: 'var(--sp-4)', marginLeft: 'var(--sp-6)', paddingLeft: 'var(--sp-3)', borderLeft: '2px solid var(--border)' }}>
          <div className="row" style={{ gap: 'var(--sp-2)' }}>
            <Avatar name="T" size={24} />
            <span className="t-body-bold">{t('gastro.reviews.answered')}</span>
            <span className="t-small c-secondary">{review.answer.createdAt ?? review.answer.date}</span>
            {variant === 'gastro' && (
              <Button variant="quiet" size="sm" onClick={() => toast(t('toast.noAction'), 'info')}>{t('common.edit')}</Button>
            )}
          </div>
          <p className="t-body" style={{ marginTop: 4 }}>{review.answer.text}</p>
        </div>
      )}

      <div className="row" style={{ marginTop: 'var(--sp-4)', gap: 'var(--sp-2)' }}>
        {variant === 'public' && (
          <>
            <Button variant="quiet" size="sm" icon={ThumbsUp} onClick={onLike}>{review.likes}</Button>
            <span className="spacer" />
            <Button variant="quiet" size="sm" icon={Flag} onClick={onReport}>{t('common.report')}</Button>
          </>
        )}
        {variant === 'gastro' && (
          <>
            {!review.answer && (
              <Button variant="secondary" size="sm" onClick={() => setReplyOpen((o) => !o)}>
                {t('gastro.reviews.reply')}
              </Button>
            )}
            <span className="spacer" />
            <Button variant="quiet" size="sm" icon={Flag} onClick={onReport}>{t('common.report')}</Button>
          </>
        )}
      </div>

      {replyOpen && (
        <div style={{ marginTop: 'var(--sp-3)' }}>
          <Field count={charCount(replyText, 500)}>
            <Textarea
              rows={3}
              maxLength={500}
              placeholder={t('gastro.reviews.replyPlaceholder')}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
          </Field>
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 'var(--sp-2)' }}>
            <Button variant="secondary" size="sm" onClick={() => setReplyOpen(false)}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!replyText.trim()}
              onClick={async () => {
                await onReply?.(replyText.trim())
                setReplyOpen(false)
                setReplyText('')
                toast(t('toast.saved'))
              }}
            >
              {t('gastro.reviews.sendReply')}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

/** Skelettvariante der Bewertungskarte. */
export function ReviewCardSkeleton() {
  return (
    <Card>
      <div className="row">
        <span className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
        <div className="grow" style={{ display: 'grid', gap: 6 }}>
          <span className="skeleton skeleton-text" style={{ width: '35%' }} />
          <span className="skeleton skeleton-text" style={{ width: '20%' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
        <span className="skeleton skeleton-text" style={{ width: '60%' }} />
        <span className="skeleton skeleton-text" style={{ width: '100%' }} />
        <span className="skeleton skeleton-text" style={{ width: '80%' }} />
      </div>
    </Card>
  )
}
