import { Route, Routes } from 'react-router-dom'
import { DesignStateProvider } from './lib/design-state'
import { SessionProvider } from './lib/session'
import { AuthGateProvider, RouteGuard } from './lib/auth'
import { UploadProvider, UploadStepGuard } from './lib/upload'
import { ToastProvider } from './design/ui'
import { LoginGate } from './components/LoginGate'
import { DevPanel } from './components/layout/DevPanel'

/* Öffentlich (TEIL C) */
import Home from './routes/public/Home'
import MapView from './routes/public/MapView'
import Feed from './routes/public/Feed'
import SearchPage from './routes/public/SearchPage'
import PlacePage from './routes/public/PlacePage'
import MenuPage from './routes/public/MenuPage'
import VideoDetail from './routes/public/VideoDetail'

/* Konto (TEIL D) */
import Register from './routes/konto/Register'
import ConfirmCode from './routes/konto/ConfirmCode'
import Login from './routes/konto/Login'
import { ForgotPassword, NewPassword } from './routes/konto/PasswordReset'

/* Nutzer (TEIL E) */
import UploadCapture from './routes/nutzer/UploadCapture'
import UploadTrim from './routes/nutzer/UploadTrim'
import UploadPlace from './routes/nutzer/UploadPlace'
import UploadReview from './routes/nutzer/UploadReview'
import UploadPublish from './routes/nutzer/UploadPublish'
import { OwnProfile, PublicProfile } from './routes/nutzer/Profile'
import Settings, { DataExport, EditProfile } from './routes/nutzer/Settings'
import Notifications from './routes/nutzer/Notifications'

/* Gastro (TEIL F) */
import { GastroLogin, GastroWelcome } from './routes/gastro/GastroAuth'
import GastroSetup from './routes/gastro/GastroSetup'
import GastroDashboard from './routes/gastro/GastroDashboard'
import GastroVideos from './routes/gastro/GastroVideos'
import GastroMenu from './routes/gastro/GastroMenu'
import GastroReviews from './routes/gastro/GastroReviews'
import GastroProfile from './routes/gastro/GastroProfile'
import GastroQr from './routes/gastro/GastroQr'
import GastroSettings from './routes/gastro/GastroSettings'
import GastroLanding from './routes/gastro/GastroLanding'
import GastroClaim from './routes/gastro/GastroClaim'

/* Admin (TEIL G) */
import AdminOverview from './routes/admin/AdminOverview'
import AdminVideos from './routes/admin/AdminVideos'
import AdminReports from './routes/admin/AdminReports'
import AdminPlaces from './routes/admin/AdminPlaces'
import AdminInvites from './routes/admin/AdminInvites'
import AdminUsers from './routes/admin/AdminUsers'
import AdminSuggestions from './routes/admin/AdminSuggestions'
import AdminLog from './routes/admin/AdminLog'

/* Rechtliches (TEIL H) und Fehler (TEIL I) */
import { CookieSettings, GastroTerms, Guidelines, Imprint, Privacy, Terms } from './routes/recht/LegalPage'
import { Forbidden, NotFound, Offline, ServerError } from './routes/fehler/ErrorPages'
import ScreenIndex from './routes/ScreenIndex'

/**
 * TEIL J — Übersicht aller Routen.
 * Alles statisch: Buttons navigieren, verändern aber nichts.
 */
export default function App() {
  return (
    <DesignStateProvider>
      <ToastProvider>
        <SessionProvider>
          <AuthGateProvider>
          <UploadProvider>
          <RouteGuard>
            <Routes>
              {/* Öffentlich */}
              <Route path="/" element={<Home />} />
              <Route path="/karte" element={<MapView />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/suche" element={<SearchPage />} />
              <Route path="/g/:slug" element={<PlacePage />} />
              <Route path="/g/:slug/speisekarte" element={<MenuPage />} />
              <Route path="/v/:id" element={<VideoDetail />} />
              <Route path="/p/:username" element={<PublicProfile />} />
              <Route path="/fuer-gastronomen" element={<GastroLanding />} />

              {/* Konto */}
              <Route path="/registrieren" element={<Register />} />
              <Route path="/registrieren/code" element={<ConfirmCode />} />
              <Route path="/anmelden" element={<Login />} />
              <Route path="/passwort-vergessen" element={<ForgotPassword />} />
              <Route path="/passwort-neu" element={<NewPassword />} />

              {/* Nutzer */}
              <Route path="/upload" element={<UploadCapture />} />
              <Route path="/upload/bearbeiten" element={<UploadStepGuard needs={['video']}><UploadTrim /></UploadStepGuard>} />
              <Route path="/upload/restaurant" element={<UploadStepGuard needs={['video']}><UploadPlace /></UploadStepGuard>} />
              <Route path="/upload/bewertung" element={<UploadStepGuard needs={['video', 'place']}><UploadReview /></UploadStepGuard>} />
              <Route path="/upload/veroeffentlichen" element={<UploadStepGuard needs={['video', 'place']}><UploadPublish /></UploadStepGuard>} />
              <Route path="/profil" element={<OwnProfile />} />
              <Route path="/benachrichtigungen" element={<Notifications />} />
              <Route path="/einstellungen" element={<Settings />} />
              <Route path="/einstellungen/profil" element={<EditProfile />} />
              <Route path="/einstellungen/daten" element={<DataExport />} />

              {/* Gastro */}
              <Route path="/gastro" element={<GastroDashboard />} />
              <Route path="/gastro/anmelden" element={<GastroLogin />} />
              <Route path="/gastro/willkommen" element={<GastroWelcome />} />
              <Route path="/gastro/einrichtung" element={<GastroSetup />} />
              <Route path="/gastro/videos" element={<GastroVideos />} />
              <Route path="/gastro/speisekarte" element={<GastroMenu />} />
              <Route path="/gastro/bewertungen" element={<GastroReviews />} />
              <Route path="/gastro/profil" element={<GastroProfile />} />
              <Route path="/gastro/qr" element={<GastroQr />} />
              <Route path="/gastro/einstellungen" element={<GastroSettings />} />
              <Route path="/gastro/eintragen" element={<GastroClaim />} />

              {/* Admin */}
              <Route path="/admin" element={<AdminOverview />} />
              <Route path="/admin/videos" element={<AdminVideos />} />
              <Route path="/admin/meldungen" element={<AdminReports />} />
              <Route path="/admin/betriebe" element={<AdminPlaces />} />
              <Route path="/admin/einladungen" element={<AdminInvites />} />
              <Route path="/admin/nutzer" element={<AdminUsers />} />
              <Route path="/admin/vorschlaege" element={<AdminSuggestions />} />
              <Route path="/admin/protokoll" element={<AdminLog />} />

              {/* Rechtliches */}
              <Route path="/impressum" element={<Imprint />} />
              <Route path="/datenschutz" element={<Privacy />} />
              <Route path="/agb" element={<Terms />} />
              <Route path="/agb-gastro" element={<GastroTerms />} />
              <Route path="/richtlinien" element={<Guidelines />} />
              <Route path="/cookies" element={<CookieSettings />} />

              {/* Fehler */}
              <Route path="/404" element={<NotFound />} />
              <Route path="/500" element={<ServerError />} />
              <Route path="/offline" element={<Offline />} />
              <Route path="/403" element={<Forbidden />} />

              {/* Werkzeug: Übersicht aller Screens */}
              <Route path="/uebersicht" element={<ScreenIndex />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </RouteGuard>
          </UploadProvider>
            <LoginGate />
            <DevPanel />
          </AuthGateProvider>
        </SessionProvider>
      </ToastProvider>
    </DesignStateProvider>
  )
}
