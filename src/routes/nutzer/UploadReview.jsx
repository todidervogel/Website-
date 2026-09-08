import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import {
  Button, Chip, Field, Modal, ModalActions, Notice, StarInput, Stepper, Textarea,
  charCount, ratingLabel,
} from '../../design/ui'
import { Page } from '../../components/layout'
import { useUpload } from '../../lib/upload'
import { api, useQuery } from '../../lib/store'
import { t } from '../../design/i18n'

const CATEGORIES = [
  { key: 'food', label: t('rating.food') },
  { key: 'service', label: t('rating.service') },
  { key: 'price', label: t('rating.priceValue') },
]

/** E.5, Bewertung, Schritt 4 */
export default function UploadReview() {
  const { draft, save } = useUpload()
  const navigate = useNavigate()
  const [skipOpen, setSkipOpen] = useState(false)
  const [dishQuery, setDishQuery] = useState('')

  const { data: dishes } = useQuery(
    () => api.menu.dishes(draft.placeId), [draft.placeId], { initial: [] },
  )

  const suggestions = useMemo(() => {
    const all = dishes ?? []
    const q = dishQuery.trim().toLowerCase()
    const chosen = new Set(draft.dishes.map((d) => d.name))
    return all
      .filter((d) => !chosen.has(d.name))
      .filter((d) => !q || d.name.toLowerCase().includes(q))
      .slice(0, 6)
  }, [dishes, dishQuery, draft.dishes])

  const setStar = (key, value) => save({ rating: { ...draft.rating, [key]: value } })

  const addDish = (dish) =>
    save((current) => ({
      dishes: current.dishes.some((d) => d.name === dish.name)
        ? current.dishes
        : [...current.dishes, { dishId: dish.id ?? null, name: dish.name, rating: 0 }],
    }))

  const addFreeText = () => {
    const name = dishQuery.trim()
    if (!name) return
    addDish({ name })
    setDishQuery('')
  }

  const removeDish = (index) =>
    save((current) => ({ dishes: current.dishes.filter((_, i) => i !== index) }))

  const rateDish = (index, value) =>
    save((current) => ({ dishes: current.dishes.map((d, i) => (i === index ? { ...d, rating: value } : d)) }))

  const hasRating =
    draft.rating.food > 0 || draft.rating.service > 0 || draft.rating.price > 0 ||
    draft.dishes.length > 0 || draft.text.trim().length > 0

  return (
    <Page title={t('upload.review.title')} footer={false}>
      <div style={{ paddingBlock: 'var(--sp-6) 140px', maxWidth: 640 }} className="stack-8">
        <div>
          <p className="t-small c-secondary">{t('upload.steps', { current: 4, total: 5 })}</p>
          <h1 className="t-h1">{t('upload.review.title')}</h1>
          <p className="t-body c-secondary" style={{ marginTop: 'var(--sp-2)' }}>{t('upload.review.subtitle')}</p>
        </div>

        <section className="stack-4">
          {CATEGORIES.map(({ key, label }) => (
            <div key={key}>
              <div className="row-between">
                <span className="t-body-bold">{label}</span>
                <Button variant="quiet" size="sm" onClick={() => setStar(key, 0)}>{t('common.skip')}</Button>
              </div>
              <StarInput value={draft.rating[key]} onChange={(v) => setStar(key, v)} label={label} />
              {draft.rating[key] > 0 && <p className="t-small c-secondary">{ratingLabel(draft.rating[key])}</p>}
            </div>
          ))}
        </section>

        <section className="stack-4">
          <div>
            <p className="field-label">{t('upload.review.hotLabel')}</p>
            <div className="row" style={{ gap: 'var(--sp-2)' }}>
              {[[true, t('common.yes')], [false, t('common.no')], [null, t('common.dontKnow')]].map(([v, label]) => (
                <Button
                  key={String(v)}
                  variant={draft.foodHot === v ? 'primary' : 'secondary'}
                  onClick={() => save({ foodHot: v })}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="field-label">{t('upload.review.groupLabel')}</p>
            <Stepper value={draft.groupSize} onChange={(v) => save({ groupSize: v })} />
          </div>
        </section>

        <section className="stack-3">
          <p className="field-label">{t('upload.review.dishesLabel')}</p>

          <form
            className="header-search"
            style={{ maxWidth: 'none' }}
            onSubmit={(e) => { e.preventDefault(); addFreeText() }}
          >
            <Search size={18} className="search-icon" />
            <input
              className="input"
              style={{ height: 44 }}
              placeholder={t('upload.review.dishesPlaceholder')}
              aria-label={t('upload.review.dishesLabel')}
              value={dishQuery}
              onChange={(e) => setDishQuery(e.target.value)}
            />
          </form>

          <div className="row-wrap">
            {suggestions.map((d) => (
              <Chip key={d.id} onClick={() => { addDish(d); setDishQuery('') }}>+ {d.name}</Chip>
            ))}
            {dishQuery.trim() && suggestions.length === 0 && (
              <Chip onClick={addFreeText}>+ „{dishQuery.trim()}“</Chip>
            )}
          </div>

          <div className="stack-2">
            {draft.dishes.map((d, i) => (
              <div className="card row-between" key={d.name} style={{ flexWrap: 'wrap' }}>
                <span className="t-body-bold grow">{d.name}</span>
                <StarInput compact value={d.rating} onChange={(v) => rateDish(i, v)} label={d.name} />
                <button
                  type="button"
                  aria-label={t('upload.review.removeDish')}
                  onClick={() => removeDish(i)}
                  className="btn btn-icon"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          <p className="t-small c-secondary">{t('upload.review.dishHint')}</p>
        </section>

        <section>
          <Field label={t('upload.review.textLabel')} count={charCount(draft.text, 1000)}>
            {(id) => (
              <Textarea
                id={id}
                rows={5}
                maxLength={1000}
                placeholder={t('upload.review.textPlaceholder')}
                value={draft.text}
                onChange={(e) => save({ text: e.target.value })}
              />
            )}
          </Field>
        </section>

        {!hasRating && <Notice>{t('upload.reviewSkipped')}</Notice>}
      </div>

      <div className="action-bar" style={{ position: 'fixed', bottom: 68, left: 0, right: 0, padding: 'var(--sp-3) var(--gutter)' }}>
        <Button variant="quiet" onClick={() => (hasRating ? navigate('/upload/veroeffentlichen') : setSkipOpen(true))}>
          {t('common.skip')}
        </Button>
        <Button variant="primary" onClick={() => navigate('/upload/veroeffentlichen')}>{t('common.next')}</Button>
      </div>

      <Modal
        open={skipOpen}
        onClose={() => setSkipOpen(false)}
        title={t('upload.review.skipDialog.title')}
        description={t('upload.review.skipDialog.text')}
        actions={
          <ModalActions onCancel={() => setSkipOpen(false)} cancelLabel={t('upload.review.skipDialog.cancel')}>
            <Button variant="primary" onClick={() => navigate('/upload/veroeffentlichen')}>
              {t('upload.review.skipDialog.confirm')}
            </Button>
          </ModalActions>
        }
      />
    </Page>
  )
}
