import React, { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { useTranslation } from 'react-i18next'
import './localization/i18n'
import { updateAppLanguage } from './helpers/language_helpers'
import { router } from './routes/router'
import { RouterProvider } from '@tanstack/react-router'
import { TooltipProvider } from '@radix-ui/react-tooltip'

export default function App() {
  const { i18n } = useTranslation()

  useEffect(() => {
    updateAppLanguage(i18n)
  }, [i18n])

  return <RouterProvider router={router} />
}

const root = createRoot(document.getElementById('app')!)
root.render(
  <React.StrictMode>
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </React.StrictMode>,
)