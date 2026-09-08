import { useCallback, useMemo, useState } from 'react'
import { t } from '../design/i18n'

/**
 * Formulare mit Prüfung.
 *
 * Absichtlich klein gehalten: Werte, Fehler, „schon angefasst" und ein
 * Absenden, das erst prüft und dann handelt. Fehler erscheinen nicht beim
 * Tippen, sondern beim Verlassen des Feldes oder beim Absenden, sonst
 * schimpft das Formular, bevor man fertig ist.
 */

export const rules = {
  required: (message) => (value) =>
    (value === undefined || value === null || String(value).trim() === '' || value === false)
      ? (message ?? t('validation.required'))
      : null,

  email: () => (value) =>
    !value || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim()) ? null : t('validation.email'),

  phone: () => (value) =>
    !value || /^[+0-9\s/()-]{6,}$/.test(String(value).trim()) ? null : t('validation.phone'),

  username: () => (value) =>
    !value || /^[a-z0-9._]{3,20}$/.test(String(value).trim().toLowerCase()) ? null : t('validation.username'),

  minLength: (n, message) => (value) =>
    !value || String(value).length >= n ? null : (message ?? t('validation.minLength', { count: n })),

  maxLength: (n) => (value) =>
    !value || String(value).length <= n ? null : t('validation.maxLength', { count: n }),

  password: () => (value) => {
    if (!value) return null
    if (String(value).length < 8) return t('validation.passwordShort')
    if (!/[A-Za-zÄÖÜäöü]/.test(value) || !/[0-9]/.test(value)) return t('validation.passwordMix')
    return null
  },

  matches: (field, message) => (value, values) =>
    !value || value === values[field] ? null : (message ?? t('validation.mismatch')),

  minAge: (years) => (value) => {
    if (!value) return null
    const birth = new Date(value)
    if (Number.isNaN(birth.getTime())) return t('validation.date')
    const age = (Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000)
    return age >= years ? null : t('validation.minAge', { years })
  },

  number: ({ min, max } = {}) => (value) => {
    if (value === '' || value == null) return null
    const n = Number(String(value).replace(',', '.'))
    if (Number.isNaN(n)) return t('validation.number')
    if (min != null && n < min) return t('validation.min', { min })
    if (max != null && n > max) return t('validation.max', { max })
    return null
  },

  url: () => (value) =>
    !value || /^([\w-]+\.)+[\w-]{2,}(\/\S*)?$/.test(String(value).replace(/^https?:\/\//, '')) ? null : t('validation.url'),
}

/** Prüft ein ganzes Formular gegen ein Regelwerk. */
export function validateAll(values, schema) {
  const errors = {}
  Object.entries(schema ?? {}).forEach(([field, list]) => {
    for (const rule of [].concat(list)) {
      const message = rule(values[field], values)
      if (message) { errors[field] = message; break }
    }
  })
  return errors
}

export function useForm({ initial = {}, schema, onSubmit }) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  const setValue = useCallback((field, value) => {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e))
    setFormError(null)
  }, [])

  const blur = useCallback((field) => {
    setTouched((tt) => ({ ...tt, [field]: true }))
    setValues((v) => {
      const list = [].concat(schema?.[field] ?? [])
      for (const rule of list) {
        const message = rule(v[field], v)
        if (message) { setErrors((e) => ({ ...e, [field]: message })); return v }
      }
      setErrors((e) => ({ ...e, [field]: undefined }))
      return v
    })
  }, [schema])

  const handleSubmit = useCallback(async (event) => {
    event?.preventDefault?.()
    const found = validateAll(values, schema)
    setErrors(found)
    setTouched(Object.fromEntries(Object.keys(schema ?? {}).map((k) => [k, true])))
    if (Object.keys(found).length > 0) return { ok: false, errors: found }

    setSubmitting(true)
    try {
      const result = await onSubmit?.(values)
      if (result && result.ok === false) {
        if (result.field) setErrors((e) => ({ ...e, [result.field]: result.error }))
        else setFormError(result.error)
        return result
      }
      return result ?? { ok: true }
    } catch (fehler) {
      /*
       * Ein Formular darf nie stumm bleiben.
       *
       * Vorher fing dieses `try` nur den Fall ab, dass `onSubmit` ordentlich
       * `{ ok: false }` zurückgibt. Wirft es stattdessen, lief der Fehler an
       * der Anzeige vorbei: Der Knopf hörte auf zu drehen und sonst passierte
       * nichts. Wer davorsitzt, drückt noch einmal und noch einmal.
       *
       * Am Netz gescheitert bekommt seinen eigenen Satz, alles andere den
       * allgemeinen. Sichtbar ist beides.
       */
      setFormError(fehler?.offline ? t('connection.short') : t('toast.error'))
      return { ok: false, error: fehler?.message }
    } finally {
      setSubmitting(false)
    }
  }, [values, schema, onSubmit])

  /** Alles, was ein Feld braucht, einmal ausbreiten und fertig. */
  const field = useCallback((name) => ({
    value: values[name] ?? '',
    onChange: (e) => setValue(name, e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e),
    onBlur: () => blur(name),
  }), [values, setValue, blur])

  return useMemo(() => ({
    values, errors, touched, submitting, formError,
    setValue, setValues, setErrors, setFormError, blur, handleSubmit, field,
    error: (name) => (touched[name] ? errors[name] : undefined),
  }), [values, errors, touched, submitting, formError, setValue, blur, handleSubmit, field])
}
