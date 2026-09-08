import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Gauge, Images, SwitchCamera, Timer, X, Zap } from 'lucide-react'
import { Button, IconButton, useToast } from '../../design/ui'
import { FullscreenPage } from '../../components/layout'
import { useUpload } from '../../lib/upload'
import { t } from '../../design/i18n'

const MAX_SECONDS = 60

/** E.1, Video aufnehmen, Schritt 1 */
export default function UploadCapture() {
  const navigate = useNavigate()
  const { draft, save } = useUpload()
  const toast = useToast()
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(draft.durationSec || 0)
  const timer = useRef(null)

  /* Statt einer echten Kamera läuft hier eine Uhr, der Ablauf bleibt derselbe. */
  useEffect(() => {
    if (!recording) return undefined
    timer.current = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= MAX_SECONDS) { setRecording(false); return MAX_SECONDS }
        return s + 1
      })
    }, 1000)
    return () => clearInterval(timer.current)
  }, [recording])

  const mmss = (total) => `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`

  const next = () => {
    if (seconds < 1) return toast(t('upload.missingVideo'), 'error')
    save({ hasVideo: true, durationSec: seconds, trimFrom: 0, trimTo: seconds })
    return navigate('/upload/bearbeiten')
  }

  /* Aus der Galerie wählen, nimmt eine Länge an und geht weiter. */
  const fromGallery = () => {
    save({ hasVideo: true, durationSec: 28, trimFrom: 0, trimTo: 28 })
    navigate('/upload/bearbeiten')
  }

  return (
    <FullscreenPage title={t('bottomNav.capture')} bottomNav={false}>
      <div className="capture">
        <div className="capture-preview" aria-hidden="true" />

        {/* Oben */}
        <div className="row-between" style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 'var(--sp-4)', zIndex: 10 }}>
          <IconButton icon={X} label={t('common.cancel')} tone="on-dark" onClick={() => navigate(-1)} />
          <div className="row" style={{ gap: 0 }}>
            <IconButton icon={Zap} label={t('upload.capture.flash')} tone="on-dark" />
            <IconButton icon={SwitchCamera} label={t('upload.capture.switch')} tone="on-dark" />
          </div>
        </div>

        {/* Rechte Spalte, im MVP ausgegraut */}
        <div style={{ position: 'absolute', right: 'var(--sp-3)', top: '35%', zIndex: 10, display: 'grid', gap: 'var(--sp-3)', opacity: 0.4 }}>
          <IconButton icon={Timer} label={t('upload.capture.timer')} tone="on-dark" disabled />
          <IconButton icon={Gauge} label={t('upload.capture.speed')} tone="on-dark" disabled />
        </div>

        {/* Unten */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 'var(--sp-4)', zIndex: 10 }}>
          <div className="row" style={{ gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
            <div className="progress-track grow">
              <div className="progress-fill" style={{ width: `${(seconds / MAX_SECONDS) * 100}%` }} />
            </div>
            <span className="t-small c-on-dark-dim">{mmss(seconds)} / 1:00</span>
          </div>

          <p className="t-small c-on-dark-dim" style={{ textAlign: 'center', marginBottom: 'var(--sp-3)' }}>
            {t('upload.capture.maxLength')}
          </p>

          <div className="row-between">
            <button
              type="button"
              onClick={fromGallery}
              style={{ background: 'none', border: 0, color: '#fff', display: 'grid', justifyItems: 'center', gap: 4, cursor: 'pointer', width: 72 }}
            >
              <Images size={24} />
              <span className="t-tiny">{t('upload.capture.gallery')}</span>
            </button>

            <button
              type="button"
              className={`capture-shutter ${recording ? 'is-recording' : ''}`}
              aria-pressed={recording}
              aria-label={t('upload.capture.shutterHint')}
              title={t('upload.capture.shutterHint')}
              onClick={() => setRecording((r) => !r)}
            />

            <div style={{ width: 72, textAlign: 'right' }}>
              <Button variant="primary" size="sm" disabled={seconds < 1} onClick={next}>{t('upload.capture.next')}</Button>
            </div>
          </div>
        </div>
      </div>
    </FullscreenPage>
  )
}
