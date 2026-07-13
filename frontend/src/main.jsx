import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initTheme } from './utils/theme'
import { initMonitoring } from './monitoring'

// Wire error monitoring (no-op unless VITE_SENTRY_DSN is configured).
initMonitoring()

// Apply the saved/system theme before first paint to avoid a flash.
initTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
