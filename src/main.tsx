import { TooltipProvider } from '@radix-ui/react-tooltip'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { RouterProvider } from '@tanstack/react-router'
import React, { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { useTranslation } from 'react-i18next'
import { AuthProvider } from './context/auth.context'
import { updateAppLanguage } from './helpers/language_helpers'
import './localization/i18n'
import { router } from './routes/router'

export default function App() {
  const { i18n } = useTranslation()

  useEffect(() => {
    updateAppLanguage(i18n)
  }, [i18n])

  return <RouterProvider router={router} />
}

const root = createRoot(document.getElementById('app')!)
root.render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID!}>
    <AuthProvider>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </AuthProvider>
  </GoogleOAuthProvider>,
)
