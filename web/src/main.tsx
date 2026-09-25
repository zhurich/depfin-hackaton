import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { GameProvider } from './store/gameStore'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* снаружи провайдера, чтобы пережить битый профиль */}
    <ErrorBoundary>
      <GameProvider>
        <App />
      </GameProvider>
    </ErrorBoundary>
  </StrictMode>,
)
