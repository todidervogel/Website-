import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Notice } from '../../design/ui'
import { CenteredPage } from '../../components/layout'
import { useSession } from '../../lib/session'
import { t } from '../../design/i18n'

/** Zeigt die Nummer teilweise verdeckt: „+49 151 •••• 6789". */
function maskPhone(phone = '') {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return phone
  return `••••  ${digits.slice(-4)}`
}

/** D.2 — Handynummer bestätigen */
export default function ConfirmCode() {
  const { pendingRegistration, confirmRegistration } = useSession()
  const navigate = useNavigate()
  const [digits, setDigits] = useState(Array(6).fill(''))
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const inputs = useRef([])

  /* Ohne laufende Registrierung ist diese Seite sinnlos. */
  useEffect(() => {
    if (!pendingRegistration) navigate('/registrieren', { replace: true })
  }, [pendingRegistration, navigate])

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const setDigit = (index, value) => {
    const clean = value.replace(/\D/g, '').slice(-1)
    setDigits((d) => d.map((x, i) => (i === index ? clean : x)))
    setError(null)
    if (clean && index < 5) inputs.current[index + 1]?.focus()
  }

  const onKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) inputs.current[index - 1]?.focus()
  }

  const onPaste = (event) => {
    const text = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!text) return
    event.preventDefault()
    setDigits(Array.from({ length: 6 }, (_, i) => text[i] ?? ''))
    inputs.current[Math.min(text.length, 5)]?.focus()
  }

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    const result = await confirmRegistration(digits.join(''))
    setBusy(false)
    if (!result.ok) return setError(result.error)
    return navigate('/profil', { replace: true })
  }

  if (!pendingRegistration) return null

  return (
    <CenteredPage title={t('auth.code.title')}>
      <h1 className="t-h1">{t('auth.code.title')}</h1>
      <p className="t-body c-secondary" style={{ marginTop: 'var(--sp-2)' }}>
        {t('auth.code.text', { phone: maskPhone(pendingRegistration.phone) })}
      </p>

      <form onSubmit={submit}>
        <div className="row" style={{ gap: 'var(--sp-2)', marginTop: 'var(--sp-6)' }} onPaste={onPaste}>
          {digits.map((value, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el }}
              className="input"
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              value={value}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              aria-label={`Ziffer ${i + 1}`}
              style={{ width: 48, height: 56, textAlign: 'center', fontSize: 19, fontWeight: 600, padding: 0 }}
            />
          ))}
        </div>

        {error && <p className="field-error" style={{ marginTop: 'var(--sp-3)' }}>{error}</p>}

        <Button
          type="submit"
          variant="primary"
          full
          loading={busy}
          disabled={digits.some((d) => !d)}
          style={{ marginTop: 'var(--sp-6)' }}
        >
          {t('auth.code.submit')}
        </Button>
      </form>

      <p className="t-small c-secondary" style={{ marginTop: 'var(--sp-4)' }}>
        {t('auth.code.notReceived')}{' '}
        {cooldown > 0 ? (
          <span className="c-tertiary">{t('auth.code.resendIn', { time: `0:${String(cooldown).padStart(2, '0')}` })}</span>
        ) : (
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => setCooldown(59)}>{t('auth.code.resend')}</button>
        )}
      </p>
      <Button variant="quiet" size="sm" to="/registrieren" style={{ marginLeft: -8 }}>{t('auth.code.changeNumber')}</Button>

    </CenteredPage>
  )
}
