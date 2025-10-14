import { TooltipProvider } from '@radix-ui/react-tooltip'
import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { useTranslation } from 'react-i18next'
import { BrowserRouter } from 'react-router-dom'
import { updateAppLanguage } from './helpers/language_helpers'
import './localization/i18n'
import { AppRoutes } from './routes/routes'

function App() {
  const { i18n } = useTranslation()

  useEffect(() => {
    updateAppLanguage(i18n)
  }, [i18n])

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
