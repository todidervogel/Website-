import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Play } from 'lucide-react'
import {
  Button, Card, EmptyState, Field, Notice, RadioCard, Switch, Textarea, charCount, useToast,
} from '../../design/ui'
import { Page } from '../../components/layout'
import { useUpload } from '../../lib/upload'
import { useSession } from '../../lib/session'
import { api, useQuery } from '../../lib/store'
import { MVP_STAGE } from '../../design/config'
import { t, tNodes } from '../../design/i18n'

/** E.6, Veröffentlichen, Schritt 5 */
export default function UploadPublish() {
  const { draft, save, reset } = useUpload()
  const { userId } = useSession()
  const [comments, setComments] = useState(false)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const published = useRef(false)
  const navigate = useNavigate()
  const toast = useToast()

  /*
   * Der Entwurf wird erst geleert, wenn diese Seite verlassen wird. Würde er
   * sofort nach dem Absenden verschwinden, schöbe der Schrittwächter uns
   * zurück auf Schritt 1, und die Erfolgsmeldung wäre nie zu sehen.
   */
  useEffect(() => () => { if (published.current) reset() }, [])

  const { data: place } = useQuery(() => api.places.byId(draft.placeId), [draft.placeId])

  const hasRating =
    draft.rating.food > 0 || draft.rating.service > 0 || draft.rating.price > 0 ||
    draft.dishes.length > 0 || draft.text.trim().length > 0

  /**
   * Hier entsteht der Datensatz wirklich: Video mit Status „in Prüfung",
   * dazu, falls ausgefüllt, die Bewertung. Beides taucht sofort im
   * eigenen Profil und in der Admin-Warteschlange auf.
   */
  const publish = async () => {
    setBusy(true)
    const video = await api.videos.create({
      placeId: draft.placeId,
      authorId: userId,
      authorType: 'user',
      caption: draft.caption.trim(),
      durationSec: Math.max(draft.trimTo - draft.trimFrom, 1),
      verifiedOnSite: draft.verifiedOnSite,
      visibility: draft.visibility,
    })

    if (hasRating) {
      await api.reviews.create({
        videoId: video.id,
        placeId: draft.placeId,
        authorId: userId,
        verifiedOnSite: draft.verifiedOnSite,
        ratingFood: draft.rating.food || null,
        ratingService: draft.rating.service || null,
        ratingPrice: draft.rating.price || null,
        foodHot: draft.foodHot,
        groupSize: draft.groupSize,
        dishes: draft.dishes.filter((d) => d.name),
        text: draft.text.trim(),
      })
    }

    setBusy(false)
    published.current = true
    setDone(true)
    toast(t('upload.published'))
  }

  if (done) {
    return (
      <Page title={t('upload.publish.doneTitle')} footer={false}>
        <div style={{ paddingBlock: 'var(--sp-16)' }}>
          <EmptyState
            icon={CheckCircle2}
            title={t('upload.publish.doneTitle')}
            text={t('upload.publish.doneText')}
            action={<Button variant="primary" to="/profil">{t('upload.publish.doneProfile')}</Button>}
            secondaryAction={<Button variant="secondary" onClick={() => navigate('/upload')}>{t('upload.publish.doneAgain')}</Button>}
          />
        </div>
      </Page>
    )
  }

  const stars = [
    draft.rating.food && `★ ${draft.rating.food} ${t('rating.food')}`,
    draft.rating.service && `★ ${draft.rating.service} ${t('rating.service')}`,
    draft.rating.price && `★ ${draft.rating.price} ${t('rating.price')}`,
  ].filter(Boolean).join(' · ')

  return (
    <Page title={t('upload.publish.title')} footer={false}>
      <div className="split" style={{ paddingBlock: 'var(--sp-6) var(--sp-16)' }}>
        <div
          style={{
            background: '#000', borderRadius: 'var(--r-card)', display: 'grid', placeItems: 'center',
            aspectRatio: '9 / 16', maxHeight: 420, width: '100%', maxWidth: 240,
          }}
        >
          <Play size={32} color="#fff" fill="#fff" strokeWidth={0} />
        </div>

        <div className="stack-6">
          <p className="t-small c-secondary">{t('upload.steps', { current: 5, total: 5 })}</p>

          <Field label={t('upload.publish.captionLabel')} count={charCount(draft.caption, 300)}>
            {(id) => (
              <Textarea
                id={id}
                rows={3}
                maxLength={300}
                placeholder={t('upload.publish.captionPlaceholder')}
                value={draft.caption}
                onChange={(e) => save({ caption: e.target.value })}
              />
            )}
          </Field>

          <Card flat>
            <div className="row-between" style={{ alignItems: 'flex-start' }}>
              <div className="stack-2">
                <p className="t-body">
                  📍 {place?.name ?? '–'}
                  {draft.verifiedOnSite && ` · ✓ ${t('upload.publish.verifiedOnSite')}`}
                </p>
                {stars && <p className="t-body">{stars}</p>}
                {draft.dishes.length > 0 && (
                  <p className="t-body">{t('upload.publish.dishesRated', { count: draft.dishes.length })}</p>
                )}
                {!hasRating && <p className="t-body c-secondary">{t('upload.reviewSkipped')}</p>}
              </div>
              <Link to="/upload/bewertung" className="btn btn-quiet btn-sm">{t('upload.publish.summaryChange')}</Link>
            </div>
          </Card>

          <div>
            <p className="field-label">{t('upload.publish.visibilityLabel')}</p>
            <div className="stack-2">
              {['public', 'friends', 'private'].map((v) => (
                <RadioCard
                  key={v}
                  name="visibility"
                  label={t(`upload.publish.visibility.${v}Title`)}
                  description={t(`upload.publish.visibility.${v}Text`)}
                  checked={draft.visibility === v}
                  onChange={() => save({ visibility: v })}
                />
              ))}
            </div>
          </div>

          <div className="row-between" style={{ opacity: MVP_STAGE >= 2 ? 1 : 0.4 }}>
            <span className="t-body">{t('upload.publish.allowComments')}</span>
            <Switch checked={comments} onChange={setComments} disabled={MVP_STAGE < 2} label={t('upload.publish.allowComments')} />
          </div>

          <Notice>
            {tNodes('upload.publish.consent', {
              guidelines: <Link to="/richtlinien" className="c-accent">{t('footer.guidelines')}</Link>,
            })}
          </Notice>

          <div className="row-between">
            <Button variant="secondary" to="/upload/bewertung">{t('common.back')}</Button>
            <Button variant="primary" loading={busy} onClick={publish}>{t('upload.publish.submit')}</Button>
          </div>
        </div>
      </div>
    </Page>
  )
}
