import { Button, Switch } from '../../design/ui'
import { DAY_KEYS, formatMinutes } from '../../lib/store'
import { t } from '../../design/i18n'

/** „11:30" → 690 Minuten. */
const toMinutes = (value) => {
  const [h, m] = String(value).split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

/**
 * Öffnungszeiten-Tabelle — F.3 (Schritt 3) und F.9 (Abschnitt Öffnungszeiten).
 *
 * Arbeitet direkt auf dem gespeicherten Format (Minuten seit Mitternacht),
 * damit „jetzt geöffnet" auf der Gastro-Seite sofort stimmt.
 */
export function HoursEditor({ value = {}, onChange }) {
  const setDay = (day, ranges) => onChange?.({ ...value, [day]: ranges })

  const setTime = (day, index, side, time) => {
    const ranges = (value[day] ?? []).map((range, i) => {
      if (i !== index) return range
      const next = [...range]
      next[side] = toMinutes(time)
      /* Schließzeiten nach Mitternacht als Wert über 24:00 führen. */
      if (side === 1 && next[1] <= next[0]) next[1] = next[0] + 60
      return next
    })
    setDay(day, ranges)
  }

  const applyAll = () => {
    const source = DAY_KEYS.find((d) => (value[d] ?? []).length > 0)
    if (!source) return
    onChange?.(Object.fromEntries(DAY_KEYS.map((d) => [d, value[source].map((r) => [...r])])))
  }

  return (
    <div>
      <Button variant="quiet" size="sm" style={{ marginLeft: -8 }} onClick={applyAll}>{t('hours.applyAll')}</Button>

      <div className="list-group" style={{ marginTop: 'var(--sp-2)' }}>
        {DAY_KEYS.map((day) => {
          const ranges = value[day] ?? []
          const isOpen = ranges.length > 0
          return (
            <div className="list-row list-row-static" key={day} style={{ flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
              <span className="t-body" style={{ width: 100, flex: 'none' }}>{t(`hours.days.${day}`)}</span>

              <Switch
                checked={isOpen}
                onChange={(v) => setDay(day, v ? [[690, 1320]] : [])}
                label={t('hours.openLabel')}
              />
              <span className="t-small c-secondary" style={{ width: 72, flex: 'none' }}>
                {isOpen ? t('hours.openLabel') : t('hours.closed')}
              </span>

              {isOpen && (
                <span className="row grow" style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
                  {ranges.map(([from, to], index) => (
                    <span className="row" key={index} style={{ gap: 'var(--sp-2)' }}>
                      <input
                        className="input" type="time" aria-label={t('hours.from')}
                        style={{ width: 120, minHeight: 36 }}
                        value={formatMinutes(from)}
                        onChange={(e) => setTime(day, index, 0, e.target.value)}
                      />
                      <span className="t-small c-secondary">–</span>
                      <input
                        className="input" type="time" aria-label={t('hours.to')}
                        style={{ width: 120, minHeight: 36 }}
                        value={formatMinutes(to)}
                        onChange={(e) => setTime(day, index, 1, e.target.value)}
                      />
                    </span>
                  ))}

                  {ranges.length < 2 && (
                    <Button variant="quiet" size="sm" onClick={() => setDay(day, [...ranges, [1080, 1320]])}>
                      {t('hours.addSpan')}
                    </Button>
                  )}
                  {ranges.length > 1 && (
                    <Button variant="quiet" size="sm" onClick={() => setDay(day, ranges.slice(0, -1))}>
                      {t('common.remove')}
                    </Button>
                  )}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
