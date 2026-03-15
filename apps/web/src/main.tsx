import { TooltipProvider } from '@radix-ui/react-tooltip';
import { createSeerialQueryClient } from '@seerial/api';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import { shallow } from 'zustand/shallow';
import { useServerStore } from '@/context/auth.store';
import { updateAppLanguage } from './localization/helpers/language_helpers';
import './localization/i18n';
import { AppRoutes } from './routes/routes';

const queryClient = createSeerialQueryClient();

function App() {
  const { i18n } = useTranslation();
  const { initializeStatusChecks } = useServerStore(
    (state) => ({ initializeStatusChecks: state.initializeStatusChecks }),
    shallow,
  );

  useEffect(() => {
    updateAppLanguage(i18n);
  }, [i18n]);

  useEffect(() => {
    // Check server and API key status on app load
    initializeStatusChecks();
  }, [initializeStatusChecks]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

const rootElement = document.getElementById('app');

if (!rootElement) {
  throw new Error('Root element with id "app" was not found.');
}

const root = createRoot(rootElement);
root.render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </QueryClientProvider>,
);
