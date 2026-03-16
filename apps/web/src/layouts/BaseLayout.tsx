import { useDataStore, useGradientStore, useServerStore } from '@seerial/stores';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { shallow } from 'zustand/shallow';
import DialogManager from '@/components/dialogs/DialogManager';
import { useIsMobile } from '@/components/hooks/use-mobile';
import DesktopMusicPlayer from '@/components/musicPlayer/desktop/DesktopMusicPlayer';
import DesktopMusicPlayerExpanded from '@/components/musicPlayer/desktop/DesktopMusicPlayerExpanded';
import MusicPlayer from '@/components/musicPlayer/MusicPlayer';
import MobileMusicPlayer from '@/components/musicPlayer/mobile/MobileMusicPlayer';
import '../styles/utils.css';
import GradientBackground from './backgrounds/GradientBackground';
import './BaseLayout.css';

export default function BaseLayout({ children }: { children: React.ReactNode }) {
  const { user } = useServerStore(
    (state) => ({
      user: state.currentUser,
    }),
    shallow,
  );
  const selectedBackground = useDataStore((state) => state.currentBackground);
  const selectedBackgroundForGradient = useGradientStore((state) => state.selectedBackground);
  const generateGradient = useGradientStore((state) => state.generateGradient);
  const prevBackground = useRef<string | undefined>(undefined);
  const [currentBackground, setCurrentBackground] = useState<string | undefined>(undefined);
  const isMobile = useIsMobile();
  const [showNewImage, setShowNewImage] = useState(false);

  const location = useLocation();
  const inMusicPage = location.pathname.includes('/album/');

  useEffect(() => {
    if (selectedBackgroundForGradient) {
      generateGradient(selectedBackgroundForGradient, false);
    }

    if (!selectedBackground) {
      setCurrentBackground(undefined);
      prevBackground.current = undefined;
      setShowNewImage(false);
      return;
    }

    const newBackground = selectedBackground;

    if (!prevBackground.current) {
      setCurrentBackground(newBackground);
      prevBackground.current = newBackground;
      setShowNewImage(false);
      return;
    }

    if (newBackground !== prevBackground.current) {
      setShowNewImage(true);

      const timeout = setTimeout(() => {
        setCurrentBackground(newBackground);
        prevBackground.current = newBackground;
        setShowNewImage(false);
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [selectedBackground, selectedBackgroundForGradient]);

  const getSafeURL = (url: string | undefined) => {
    return url ? url.replace(/\\/g, '/home') : '';
  };

  return (
    <div className="relative">
      <GradientBackground imageSrc={selectedBackgroundForGradient} showGradient={inMusicPage} />

      {/* Current background */}
      {/* <div
        className="background-layer"
        style={{
          backgroundImage:
            (inMusicPage || inDetailsPage) && currentBackground
              ? `url(${currentBackground.startsWith('http') ? getSafeURL(currentBackground) : isAbsolutePath(currentBackground) ? `/api/image?path=${encodeURIComponent(currentBackground)}` : `/api/${getSafeURL(currentBackground)}`})`
              : 'none',
          opacity: inDetailsPage && currentBackground ? 1 : 0,
        }}
      /> */}

      {/* New background that fades in */}
      {/* {(inMusicPage || inDetailsPage) && showNewImage && selectedBackground && (
        <div
          className="background-layer fade-in"
          style={{
            backgroundImage: `url(${selectedBackground.startsWith('http') ? getSafeURL(selectedBackground) : isAbsolutePath(selectedBackground) ? `/api/image?path=${encodeURIComponent(selectedBackground)}` : `/api/${getSafeURL(selectedBackground)}`})`,
          }}
        />
      )} */}

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
