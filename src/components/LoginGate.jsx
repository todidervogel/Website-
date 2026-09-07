import { useNavigate } from 'react-router-dom'
import { Button, Modal, ModalActions } from '../design/ui'
import { useAuthGate } from '../lib/auth'
import { t } from '../design/i18n'

/**
 * Hinweis für den Gastmodus auf der Website: die gewünschte Aktion setzt ein
 * Konto voraus. Wird von useRequireLogin() ausgelöst (siehe src/lib/auth.jsx).
 */
export function LoginGate() {
  const { gateOpen, closeGate } = useAuthGate()
  const navigate = useNavigate()

  const go = (to) => () => {
    closeGate()
    navigate(to)
  }

  return (
    <Modal
      open={gateOpen}
      onClose={closeGate}
      title={t('auth.gate.title')}
      description={t('auth.gate.text')}
      actions={
        <ModalActions onCancel={closeGate}>
          <Button variant="secondary" onClick={go('/registrieren')}>{t('auth.gate.register')}</Button>
          <Button variant="primary" onClick={go('/anmelden')}>{t('auth.gate.login')}</Button>
        </ModalActions>
      }
    />
  )
}
