import { useServerStore } from '@/context/auth.store'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { useTranslation } from 'react-i18next'
import { BrowserRouter } from 'react-router-dom'
import { shallow } from 'zustand/shallow'
import { updateAppLanguage } from './localization/helpers/language_helpers'
import './localization/i18n'
import { AppRoutes } from './routes/routes'

function App() {
  const { i18n } = useTranslation()
  const { initializeStatusChecks } = useServerStore(
    (state) => ({ initializeStatusChecks: state.initializeStatusChecks }),
    shallow,
  )

  useEffect(() => {
    updateAppLanguage(i18n)
  }, [i18n])

  useEffect(() => {
    // Check server and API key status on app load
    initializeStatusChecks()
  }, [initializeStatusChecks])

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

const root = createRoot(document.getElementById('app')!)
root.render(
  <TooltipProvider>
    <App />
  </TooltipProvider>,
)
