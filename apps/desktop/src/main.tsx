import { init, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { seerialQueryClient, setApiBaseUrl } from '@seerial/api';
import { useServerStore } from '@seerial/stores';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import { GlobalMusicPlayer } from '@/features/music-player';
import { UpdateDialog } from '@/features/updater';
import { useFeedbackSounds } from '@/shared/hooks/use-feedback-sounds';
import { AppRoutes } from './routes';
import { updateAppLanguage } from './shared/localization/language.helpers';
import './shared/localization/i18n';

function App() {
  const { i18n } = useTranslation();
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');

  useFeedbackSounds();

  useEffect(() => {
    init({
      //debug: true, // Enable debug mode for spatial navigation
    });

    const focusFrame = window.requestAnimationFrame(() => {
      setFocus('continueWatching');
    });

    return () => window.cancelAnimationFrame(focusFrame);
  }, []);

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
      <UpdateDialog />
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
