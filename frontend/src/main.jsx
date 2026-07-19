import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PublicView from './pages/PublicView.jsx'
import { initTheme } from './utils/theme'
import { initMonitoring } from './monitoring'

// Wire error monitoring (no-op unless VITE_SENTRY_DSN is configured).
initMonitoring()

// Apply the saved/system theme before first paint to avoid a flash.
initTheme()

// Public share links (/s/:token) render a standalone read-only view, bypassing
// the authenticated app shell entirely.
const shareMatch = window.location.pathname.match(/^\/s\/([a-f0-9]+)$/i);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {shareMatch ? <PublicView token={shareMatch[1]} /> : <App />}
  </StrictMode>,
)
