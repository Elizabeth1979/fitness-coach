import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { keepAppUpdated } from './pwa/update'
import { ErrorBoundary } from './ui/ErrorBoundary'

if (import.meta.env.PROD) keepAppUpdated()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
