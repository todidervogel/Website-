import { Navigate } from 'react-router-dom'
import { useDesignState } from '../../lib/design-state'
import { useSession } from '../../lib/session'

/**
 * Was unter `/` passiert.
 *
 * Die Anwendung soll mit dem Feed anfangen, nicht mit einer Broschüre. Wer
 * angemeldet ist, und in der App überhaupt jeder, landet deshalb sofort
 * dort. Der Standort ist voreingestellt, der Umkreis auch; es läuft also
 * gleich etwas.
 *
 * Die Präsentationsseite bleibt für die, die das Produkt noch nicht kennen:
 * Besucher im Browser ohne Konto. So hält es Instagram auch, eingeloggt der
 * Feed, ausgeloggt die Seite, die erklärt, worum es geht.
 */
export function Start({ landing }) {
  const { isApp } = useDesignState()
  const { loggedIn, ready } = useSession()

  /* Solange die Sitzung geladen wird, gilt niemand als abgemeldet. Sonst
     blitzte die Präsentationsseite kurz auf, bevor der Feed übernimmt. */
  if (!ready) return null

  if (isApp || loggedIn) return <Navigate to="/feed" replace />
  return landing
}
