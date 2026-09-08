import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Music, Smile, SlidersHorizontal, Type } from 'lucide-react'
import { Button } from '../../design/ui'
import { FullscreenPage } from '../../components/layout'
import { useUpload } from '../../lib/upload'
import { t } from '../../design/i18n'

const TOOLS = [
  [Music, 'music'], [Type, 'text'], [SlidersHorizontal, 'filter'], [Smile, 'sticker'],
]

const mmss = (total) => `${Math.floor(total / 60)}:${String(Math.round(total % 60)).padStart(2, '0')}`

/** E.2, Video zuschneiden, Schritt 2 */
export default function UploadTrim() {
  const { draft, save } = useUpload()
  const navigate = useNavigate()
  const total = draft.durationSec || 1
  const [from, setFrom] = useState(draft.trimFrom ?? 0)
  const [to, setTo] = useState(draft.trimTo || total)

  const next = () => {
    save({ trimFrom: from, trimTo: to })
    navigate('/upload/restaurant')
  }

  return (
    <FullscreenPage title={t('upload.trim.title')} bottomNav={false}>
      <div className="fullheight" style={{ display: 'flex', flexDirection: 'column', color: '#fff' }}>
        {/* Videovorschau */}
        <div style={{ flex: '1 1 auto', background: 'linear-gradient(200deg, #33333B, #131317)', minHeight: 320 }} />

        <div style={{ padding: 'var(--sp-4)' }} className="stack-4">
          {/* Zeitleiste mit Miniaturbildern und zwei Griffen */}
          <div>
            <div style={{ position: 'relative', display: 'flex', gap: 2, height: 56, borderRadius: 'var(--r-control)', overflow: 'hidden' }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} style={{ flex: 1, background: i > 1 && i < 8 ? '#3A3A44' : '#22222A' }} />
              ))}
              <span style={{ position: 'absolute', left: `${(from / total) * 100}%`, top: 0, bottom: 0, width: 10, background: 'var(--accent)', borderRadius: '4px 0 0 4px' }} />
              <span style={{ position: 'absolute', left: `calc(${(to / total) * 100}% - 10px)`, top: 0, bottom: 0, width: 10, background: 'var(--accent)', borderRadius: '0 4px 4px 0' }} />
            </div>

            <div className="stack-2" style={{ marginTop: 'var(--sp-3)' }}>
              <label className="t-small c-on-dark-dim">
                {t('hours.from')}
                <input
                  type="range" min={0} max={Math.max(total - 1, 0)} value={from}
                  onChange={(e) => setFrom(Math.min(Number(e.target.value), to - 1))}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
              </label>
              <label className="t-small c-on-dark-dim">
                {t('hours.to')}
                <input
                  type="range" min={1} max={total} value={to}
                  onChange={(e) => setTo(Math.max(Number(e.target.value), from + 1))}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
              </label>
            </div>

            <p className="t-small c-on-dark-dim" style={{ marginTop: 'var(--sp-2)' }}>
              {t('upload.trim.selected', { from: mmss(from), to: mmss(to), seconds: to - from })}
            </p>
          </div>

          {/* Werkzeugleiste, im MVP alle ausgegraut */}
          <div className="row" style={{ gap: 'var(--sp-4)', justifyContent: 'center' }}>
            {TOOLS.map(([Icon, key]) => (
              <button
                key={key}
                type="button"
                disabled
                title={t('common.comingSoon')}
                style={{ background: 'none', border: 0, color: '#fff', opacity: 0.4, display: 'grid', justifyItems: 'center', gap: 4, cursor: 'default' }}
              >
                <span style={{ position: 'relative' }}>
                  <Icon size={22} />
                  <Lock size={11} style={{ position: 'absolute', right: -6, bottom: -2 }} />
                </span>
                <span className="t-tiny">{t(`upload.trim.tools.${key}`)}</span>
              </button>
            ))}
          </div>
          <p className="t-small c-on-dark-dim" style={{ textAlign: 'center' }}>{t('common.comingSoon')}</p>

          <div className="row-between">
            <Button variant="secondary" to="/upload" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.4)' }}>
              {t('common.back')}
            </Button>
            <Button variant="primary" onClick={next}>{t('common.next')}</Button>
          </div>
        </div>
      </div>
    </FullscreenPage>
  )
}
