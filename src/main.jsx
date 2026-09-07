import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './design/styles/tokens.css'
import './design/styles/base.css'
import './design/styles/components.css'
import './design/styles/layout.css'

/**
 * Der Router muss wissen, unter welchem Pfad die Seite liegt.
 * Bei GitHub Pages ist das "/design/", lokal und in der App "/".
 */
const basename = import.meta.env.BASE_URL.startsWith('/') ? import.meta.env.BASE_URL : '/'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
