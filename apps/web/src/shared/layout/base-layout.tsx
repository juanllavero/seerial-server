import { useDataStore, useGradientStore, useServerStore } from '@seerial/stores';
import type React from 'react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { shallow } from 'zustand/shallow';
import { DialogManager } from '@/features/management';
import {
  DesktopMusicPlayer,
  DesktopMusicPlayerExpanded,
  MobileMusicPlayer,
  MusicPlayer,
} from '@/features/player';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import '../../styles/utils.css';
import GradientBackground from './backgrounds/gradient-background';
import './base-layout.css';
import DetailsBackgroundLayers from './backgrounds/details-background-layers';

export default function BaseLayout({ children }: { children: React.ReactNode }) {
  const { user } = useServerStore(
    (state) => ({
      user: state.currentUser,
    }),
    shallow,
  );
  const { currentBackground } = useDataStore(
    (state) => ({
      currentBackground: state.currentBackground,
    }),
    shallow,
  );
  const selectedBackgroundForGradient = useGradientStore((state) => state.selectedBackground);
  const generateGradient = useGradientStore((state) => state.generateGradient);
  const isMobile = useIsMobile();

  const location = useLocation();
  const inMusicPage = location.pathname.includes('/album/');

  useEffect(() => {
    if (selectedBackgroundForGradient) {
      generateGradient(selectedBackgroundForGradient, false);
    }
  }, [generateGradient, selectedBackgroundForGradient]);

  return (
    <div className="relative">
      <GradientBackground imageSrc={selectedBackgroundForGradient} showGradient={inMusicPage} />

      <DetailsBackgroundLayers imageSrc={currentBackground} />

      {/* Toaster root */}
      <Toaster theme="dark" richColors />

      {/* Load components only if the user is logged in */}
      {user && (
        <>
          <DialogManager />
          <MusicPlayer />

          {isMobile ? (
            <MobileMusicPlayer />
          ) : (
            <>
              <DesktopMusicPlayer />
              <DesktopMusicPlayerExpanded />
            </>
          )}
        </>
      )}

      {children}
    </div>
  );
}
