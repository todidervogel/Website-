import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown, ChevronUp, ClipboardList, Ellipsis, ExternalLink, Image, Pencil, Trash2,
  UtensilsCrossed,
} from 'lucide-react'
import {
  Badge, Button, Checkbox, Chip, Dropzone, EmptyState, Field, IconButton, Input,
  Menu, MenuItem, Modal, ModalActions, Select, Skeleton, Switch, Textarea, Thumb,
  charCount, useToast,
} from '../../design/ui'
import { GastroShell, useMyPlace } from './GastroShell'
import { ConsoleHeader } from '../../components/layout'
import { api, useQuery } from '../../lib/store'
import { rules, useForm } from '../../lib/form'
import { ALLERGEN_KEYS } from '../../design/vocabulary'
import { t } from '../../design/i18n'

const DIETS = ['vegetarisch', 'vegan', 'glutenfrei']

/** „9,50" → 950 Cent. Komma und Punkt sind beide erlaubt. */
const toCents = (value) => Math.round(Number(String(value).replace(',', '.')) * 100) || 0
const toEuro = (cents) => (cents / 100).toFixed(2).replace('.', ',')

/** F.6, Gastro-Speisekarte */
export default function GastroMenu() {
  return (
    <GastroShell title={t('gastro.menu.title')}>
      <MenuEditor />
    </GastroShell>
  )
}

function MenuEditor() {
  const place = useMyPlace()
  const [dishDialog, setDishDialog] = useState(null)   // { categoryId } | { dish }
  const [categoryDialog, setCategoryDialog] = useState(null) // 'new' | category
  const [confirmDelete, setConfirmDelete] = useState(null)
  const toast = useToast()

  const { data: categories, loading } = useQuery(
    () => api.menu.get(place.id), [place.id], { initial: [] },
  )
  const list = categories ?? []
  const total = list.reduce((sum, c) => sum + c.items.length, 0)

  const removeDish = async (dish) => {
    await api.menu.removeDish(dish.id)
    toast(t('gastro.menu.dishRemoved'))
  }

  const removeCategory = async (category) => {
    await api.menu.removeCategory(category.id)
    setConfirmDelete(null)
    toast(t('common.removed'))
  }

  return (
    <>
      <ConsoleHeader title={t('gastro.menu.title')}>
        <Button variant="quiet" icon={ExternalLink} to={`/g/${place.slug}/speisekarte`}>
          {t('gastro.menu.viewPublic')}
        </Button>
        <Button variant="secondary" onClick={() => setCategoryDialog('new')}>{t('gastro.menu.addCategory')}</Button>
        <Button
          variant="primary"
          disabled={list.length === 0}
          onClick={() => setDishDialog({ categoryId: list[0]?.id })}
        >
          {t('gastro.menu.addDish')}
        </Button>
      </ConsoleHeader>

      <p className="t-small c-secondary" style={{ marginBottom: 'var(--sp-6)' }}>
        {t('gastro.menu.subtitle')}
      </p>

      {loading ? (
        <div className="stack-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} h={64} radius="var(--r-card)" />)}
        </div>
      ) : total === 0 && list.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={t('gastro.menu.emptyTitle')}
          text={t('gastro.menu.emptyText')}
          action={<Button variant="primary" onClick={() => setCategoryDialog('new')}>{t('gastro.menu.addCategory')}</Button>}
        />
      ) : (
        <div className="stack-8">
          {list.map((category, index) => (
            <section key={category.id}>
              <div className="row-between" style={{ marginBottom: 'var(--sp-3)' }}>
                <div className="row" style={{ gap: 'var(--sp-2)' }}>
                  <span className="row" style={{ gap: 0 }}>
                    <IconButton
                      icon={ChevronUp} label={t('common.moveUp')} size={16}
                      disabled={index === 0}
                      onClick={() => api.menu.moveCategory(category.id, -1)}
                    />
                    <IconButton
                      icon={ChevronDown} label={t('common.moveDown')} size={16}
                      disabled={index === list.length - 1}
                      onClick={() => api.menu.moveCategory(category.id, 1)}
                    />
                  </span>
                  <h2 className="t-h2">{category.name}</h2>
                  <span className="t-small c-tertiary">{t('menu.itemCount', { count: category.items.length })}</span>
                </div>
                <Menu
                  align="right"
                  trigger={({ toggle }) => <IconButton icon={Ellipsis} label={t('common.more')} onClick={toggle} />}
                >
                  {({ close }) => (
                    <>
                      <MenuItem onClick={() => { close(); setDishDialog({ categoryId: category.id }) }}>
                        {t('gastro.menu.addDish')}
                      </MenuItem>
                      <MenuItem onClick={() => { close(); setCategoryDialog(category) }}>{t('common.rename')}</MenuItem>
                      <MenuItem danger onClick={() => { close(); setConfirmDelete(category) }}>{t('common.delete')}</MenuItem>
                    </>
                  )}
                </Menu>
              </div>

              {category.description && (
                <p className="t-small c-secondary" style={{ marginBottom: 'var(--sp-3)' }}>{category.description}</p>
              )}

              {category.items.length === 0 ? (
                <Button variant="secondary" onClick={() => setDishDialog({ categoryId: category.id })}>
                  {t('gastro.menu.addDish')}
                </Button>
              ) : (
                <div className="list-group">
                  {category.items.map((d) => (
                    <div className="list-row list-row-static" key={d.id}>
                      <Thumb size={48} icon={UtensilsCrossed} />
                      <div className="grow">
                        <p className="t-body-bold">{d.name}</p>
                        <p className="t-small c-secondary clamp-2">{d.description}</p>
                        <div className="row-wrap" style={{ gap: 4, marginTop: 4 }}>
                          {(d.diet ?? []).map((k) => <Badge key={k} tone="success">{t(`diet.${k}`)}</Badge>)}
                          {d.popular && <Badge tone="accent">{t('menu.popular')}</Badge>}
                        </div>
                      </div>
                      <span className="t-body-bold" style={{ flex: 'none' }}>{toEuro(d.priceCents)} €</span>
                      <div className="row" style={{ gap: 'var(--sp-2)', flex: 'none' }}>
                        <span className="t-small c-secondary only-desktop">{t('gastro.menu.availableLabel')}</span>
                        <Switch
                          checked={d.available !== false}
                          onChange={(v) => api.menu.updateDish(d.id, { available: v })}
                          label={t('gastro.menu.availableLabel')}
                        />
                        <IconButton icon={Pencil} label={t('common.edit')} onClick={() => setDishDialog({ dish: d })} />
                        <IconButton icon={Trash2} label={t('common.delete')} onClick={() => removeDish(d)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}

          <p className="t-small c-tertiary">
            {t('menu.updatedHint')}{' '}
            <Link to={`/g/${place.slug}/speisekarte`} className="c-accent">{t('gastro.menu.viewPublic')}</Link>
          </p>
        </div>
      )}

      {/*
        Die Dialoge werden erst beim Öffnen eingehängt. Sonst berechnet das
        Formular seine Startwerte, während die Speisekarte noch lädt, dann
        steht die Kategorie leer und das Speichern scheitert an der Prüfung.
      */}
      {dishDialog && (
        <DishDialog
          state={dishDialog}
          categories={list}
          placeId={place.id}
          onClose={() => setDishDialog(null)}
        />
      )}

      {categoryDialog && (
        <CategoryDialog
          category={categoryDialog === 'new' ? null : categoryDialog}
          placeId={place.id}
          onClose={() => setCategoryDialog(null)}
        />
      )}

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title={t('gastro.menu.deleteCategory')}
        description={confirmDelete
          ? t('gastro.menu.deleteCategoryConfirm', { count: confirmDelete.items.length })
          : ''}
        actions={
          <ModalActions onCancel={() => setConfirmDelete(null)}>
            <Button variant="danger" onClick={() => removeCategory(confirmDelete)}>{t('common.delete')}</Button>
          </ModalActions>
        }
      />
    </>
  )
}

function CategoryDialog({ category, placeId, onClose }) {
  const toast = useToast()
  const form = useForm({
    initial: { name: category?.name ?? '', description: category?.description ?? '' },
    schema: { name: [rules.required(), rules.maxLength(60)] },
    onSubmit: async (values) => {
      if (category) await api.menu.updateCategory(category.id, { name: values.name.trim(), description: values.description.trim() })
      else await api.menu.addCategory(placeId, values.name.trim())
      toast(t('gastro.menu.categoryAdded'))
      onClose()
      return { ok: true }
    },
  })

  return (
    <Modal
      open
      onClose={onClose}
      title={category ? t('common.rename') : t('gastro.menu.newCategory')}
      actions={
        <ModalActions onCancel={onClose}>
          <Button variant="primary" loading={form.submitting} onClick={form.handleSubmit}>{t('common.save')}</Button>
        </ModalActions>
      }
    >
      <div className="stack-3">
        <Field label={t('gastro.menu.categoryName')} required error={form.error('name')}>
          {(id) => <Input id={id} {...form.field('name')} />}
        </Field>
        <Field label={t('gastro.menu.categoryDescription')}>
          {(id) => <Textarea id={id} rows={2} {...form.field('description')} />}
        </Field>
      </div>
    </Modal>
  )
}

function DishDialog({ state, categories, placeId, onClose }) {
  const dish = state?.dish
  const toast = useToast()

  const form = useForm({
    initial: {
      name: dish?.name ?? '',
      description: dish?.description ?? '',
      price: dish ? toEuro(dish.priceCents) : '',
      categoryId: dish?.categoryId ?? state?.categoryId ?? categories[0]?.id ?? '',
      diet: dish?.diet ?? [],
      allergens: dish?.allergens ?? [],
      spicy: dish?.spicy ?? 0,
      popular: dish?.popular ?? false,
      available: dish?.available !== false,
    },
    schema: {
      name: [rules.required(), rules.maxLength(80)],
      price: [rules.required(), rules.number({ min: 0, max: 999 })],
      categoryId: [rules.required()],
    },
    onSubmit: async (values) => {
      const payload = {
        name: values.name.trim(),
        description: values.description.trim(),
        priceCents: toCents(values.price),
        categoryId: values.categoryId,
        diet: values.diet,
        allergens: values.allergens,
        spicy: Number(values.spicy) || 0,
        popular: !!values.popular,
        available: !!values.available,
        confirmed: true,
      }
      if (dish) await api.menu.updateDish(dish.id, payload)
      else await api.menu.addDish(placeId, values.categoryId, payload)
      toast(dish ? t('gastro.menu.saved') : t('gastro.menu.dishAdded'))
      onClose()
      return { ok: true }
    },
  })

  const toggleIn = (field) => (value) =>
    form.setValue(field, form.values[field].includes(value)
      ? form.values[field].filter((x) => x !== value)
      : [...form.values[field], value])

  return (
    <Modal
      open
      onClose={onClose}
      title={dish ? t('gastro.menu.dialogEdit') : t('gastro.menu.dialogAdd')}
      actions={
        <ModalActions onCancel={onClose}>
          <Button variant="primary" loading={form.submitting} onClick={form.handleSubmit}>{t('common.save')}</Button>
        </ModalActions>
      }
    >
      <div className="stack-3">
        <Field label={t('gastro.menu.nameLabel')} required error={form.error('name')}>
          {(id) => <Input id={id} placeholder={t('gastro.menu.namePlaceholder')} {...form.field('name')} />}
        </Field>

        <Field label={t('gastro.menu.descriptionLabel')} count={charCount(form.values.description, 300)}>
          {(id) => <Textarea id={id} rows={3} maxLength={300} {...form.field('description')} />}
        </Field>

        <div className="row" style={{ gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
          <Field label={t('gastro.menu.priceLabel')} required className="grow" error={form.error('price')}>
            {(id) => (
              <div className="input-affix">
                <input
                  id={id} className="input" inputMode="decimal"
                  placeholder={t('gastro.menu.pricePlaceholder')} {...form.field('price')}
                />
                <span className="affix">€</span>
              </div>
            )}
          </Field>
          <Field label={t('gastro.menu.categoryLabel')} required className="grow" error={form.error('categoryId')}>
            {(id) => (
              <Select
                id={id}
                placeholder="–"
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                value={form.values.categoryId}
                onChange={(e) => form.setValue('categoryId', e.target.value)}
              />
            )}
          </Field>
        </div>

        <Field label={t('gastro.menu.imageLabel')}>
          <Dropzone icon={Image} small text={t('gastro.setup.dropImage')} />
        </Field>

        <Field label={t('gastro.menu.dietLabel')}>
          <div className="row-wrap">
            {DIETS.map((key) => (
              <Chip key={key} active={form.values.diet.includes(key)} onClick={() => toggleIn('diet')(key)}>
                {t(`diet.${key}`)}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label={t('gastro.menu.spicyLabel')}>
          <div className="seg">
            {[0, 1, 2, 3].map((level) => (
              <button
                key={level}
                type="button"
                aria-pressed={Number(form.values.spicy) === level}
                onClick={() => form.setValue('spicy', level)}
              >
                {level === 0 ? '–' : '·'.repeat(level)}
              </button>
            ))}
          </div>
        </Field>

        <Field label={t('allergens.label')} hint={t('allergens.hint')}>
          <div className="row-wrap">
            {ALLERGEN_KEYS.map((key) => (
              <Chip key={key} active={form.values.allergens.includes(key)} onClick={() => toggleIn('allergens')(key)}>
                {t(`allergens.${key}`)}
              </Chip>
            ))}
          </div>
        </Field>

        <Checkbox
          label={t('gastro.menu.popularLabel')}
          checked={form.values.popular}
          onChange={(e) => form.setValue('popular', e.target.checked)}
        />
        <Checkbox
          label={t('gastro.menu.availableLabel')}
          checked={form.values.available}
          onChange={(e) => form.setValue('available', e.target.checked)}
        />
      </div>
    </Modal>
  )
}
