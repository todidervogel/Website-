import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * VITE_BASE steuert, unter welchem Pfad die gebaute Seite liegt:
 *
 *   npm run dev                          → "/"        (lokal)
 *   VITE_BASE=/design/ npm run build     → GitHub Pages unter /design/
 *   VITE_BASE=./ npm run build           → App-Paket (Capacitor), relative Pfade
 */
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
})
