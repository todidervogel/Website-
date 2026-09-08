import { Check, Moon, MonitorSmartphone, Sun } from 'lucide-react'
import { Menu, MenuItem } from '../../design/ui'
import { useDesignState } from '../../lib/design-state'
import { t } from '../../design/i18n'

const ICONS = { auto: MonitorSmartphone, light: Sun, dark: Moon }

/**
 * Umschalter für die Darstellung.
 *
 * Steht bewusst in der Kopfleiste und nicht nur in den Einstellungen: In der
 * App liegen die Einstellungen hinter der Anmeldung, und dann käme man vor
 * dem ersten Login gar nicht an den Dunkelmodus heran.
 */
export function ThemeToggle({ align = 'right' }) {
  const { theme, setTheme, darkMode } = useDesignState()
  const Icon = ICONS[theme] ?? MonitorSmartphone

  return (
    <Menu
      align={align}
      trigger={({ toggle }) => (
        <button
          type="button"
          className="btn btn-icon"
          onClick={toggle}
          aria-label={`${t('theme.toggle')}: ${t(`theme.${theme}`)}`}
          title={t('theme.toggle')}
        >
          <Icon size={20} />
        </button>
      )}
    >
      {({ close }) => (
        <>
          <p className="dropdown-title">{t('theme.label')}</p>
          {['auto', 'light', 'dark'].map((key) => {
            const OptionIcon = ICONS[key]
            return (
              <MenuItem
                key={key}
                icon={OptionIcon}
                onClick={() => { setTheme(key); close() }}
              >
                {t(`theme.${key}`)}
                {theme === key && <Check size={18} className="c-accent" style={{ marginLeft: 'auto' }} />}
              </MenuItem>
            )
          })}
          {/*
            * Stand als .t-tiny da: Großbuchstaben mit Sperrung. „FOLGT DER
            * EINSTELLUNG DEINES GERÄTS. HELL." schreit einen an. Jetzt in
            * gewöhnlicher Schreibweise, und nur dann, wenn „Automatisch"
            * gewählt ist, sonst erklärt der Satz etwas, das nicht gilt.
            */}
          {theme === 'auto' && (
            <p className="dropdown-hint">
              {`${t('theme.autoHint')} ${darkMode ? t('theme.dark') : t('theme.light')}.`}
            </p>
          )}
        </>
      )}
    </Menu>
  )
}

/** Dieselbe Auswahl als Schalterzeile, für die Einstellungen. */
export function ThemeSegments() {
  const { theme, setTheme } = useDesignState()
  return (
    <div className="seg">
      {['auto', 'light', 'dark'].map((key) => (
        <button key={key} type="button" aria-pressed={theme === key} onClick={() => setTheme(key)}>
          {t(`theme.${key}`)}
        </button>
      ))}
    </div>
  )
}
