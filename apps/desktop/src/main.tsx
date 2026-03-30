import { seerialQueryClient, setApiBaseUrl } from '@seerial/api';
import { useServerStore } from '@seerial/stores';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import GlobalMusicPlayer from '@/features/music-player/global-music-player';
import { AppRoutes } from './routes/routes';
import './localization/i18n';
import { init, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { updateAppLanguage } from './helpers/language_helpers';

function App() {
  const { i18n } = useTranslation();
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');

  init({
    //debug: true, // Enable debug mode for spatial navigation
  });

  setFocus('continueWatching');

  useEffect(() => {
    updateAppLanguage(i18n);
  }, [i18n]);

  useEffect(() => {
    setApiBaseUrl(serverUrl);
  }, [serverUrl]);

  return (
    <BrowserRouter>
      <AppRoutes />
      <GlobalMusicPlayer />
    </BrowserRouter>
  );
}

// biome-ignore lint/style/noNonNullAssertion: <Document should not be null since we control the HTML>
const root = createRoot(document.getElementById('root')!);
root.render(
  <QueryClientProvider client={seerialQueryClient}>
    <App />
  </QueryClientProvider>,
);
