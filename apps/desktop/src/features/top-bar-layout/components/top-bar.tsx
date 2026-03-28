import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useGetLibraries } from '@seerial/api';
import { type Library, LibraryTypes } from '@seerial/domain';
import { useServerStore } from '@seerial/stores';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronUp, Settings } from 'lucide-react';
import { memo, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import NavigationButton from '@/components/navigation/NavigationButton';
import NavigationContainer from '@/components/navigation/NavigationContainer';
import { NavigationFocusKeys } from '@/shared/navigation/constants';
import LibrariesList from './libraries-list';

const AUTO_OPEN_DELAY_MS = 1000;

const LIBRARY_TYPE_BUTTONS = {
  [LibraryTypes.MOVIES]: NavigationFocusKeys.topBar.movies,
  [LibraryTypes.SHOWS]: NavigationFocusKeys.topBar.shows,
  [LibraryTypes.MUSIC]: NavigationFocusKeys.topBar.music,
} as const;

function TopBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [showLibraries, setShowLibraries] = useState(false);
  const [libraryType, setLibraryType] = useState<LibraryTypes>(LibraryTypes.MOVIES);
  const [activeLibraryButtonKey, setActiveLibraryButtonKey] = useState<
    (typeof LIBRARY_TYPE_BUTTONS)[LibraryTypes]
  >(LIBRARY_TYPE_BUTTONS[LibraryTypes.MOVIES]);

  const autoOpenTimeoutRef = useRef<number | null>(null);
  const focusToRestoreRef = useRef<string | null>(null);
  const preventNextAutoOpenFocusKeyRef = useRef<string | null>(null);

  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');

  const { data: libraries } = useGetLibraries<Library[]>({
    enabled: serverUrl !== '',
    refetchOnWindowFocus: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const moviesLibraries = libraries?.filter((library) => library.type === LibraryTypes.MOVIES);
  const seriesLibraries = libraries?.filter((library) => library.type === LibraryTypes.SHOWS);
  const albumsLibraries = libraries?.filter((library) => library.type === LibraryTypes.MUSIC);
  const selectedLibraries = libraries?.filter((library) => library.type === libraryType) ?? [];

  const showMovies = moviesLibraries && moviesLibraries.length > 0;
  const showSeries = seriesLibraries && seriesLibraries.length > 0;
  const showMusic = albumsLibraries && albumsLibraries.length > 0;

  function clearAutoOpenTimeout() {
    if (autoOpenTimeoutRef.current) {
      window.clearTimeout(autoOpenTimeoutRef.current);
      autoOpenTimeoutRef.current = null;
    }
  }

  function openLibraries(nextType: LibraryTypes) {
    const nextLibraries = libraries?.filter((library) => library.type === nextType) ?? [];

    if (nextLibraries.length === 0) {
      return;
    }

    clearAutoOpenTimeout();
    setLibraryType(nextType);
    setShowLibraries(true);
  }

  function scheduleLibraryAutoOpen(nextType: LibraryTypes) {
    clearAutoOpenTimeout();

    const focusKey = LIBRARY_TYPE_BUTTONS[nextType];

    if (preventNextAutoOpenFocusKeyRef.current === focusKey) {
      preventNextAutoOpenFocusKeyRef.current = null;
      return;
    }

    autoOpenTimeoutRef.current = window.setTimeout(() => {
      openLibraries(nextType);
    }, AUTO_OPEN_DELAY_MS);
  }

  function handleLibraryTypeFocus(nextType: LibraryTypes) {
    const focusKey = LIBRARY_TYPE_BUTTONS[nextType];

    setLibraryType(nextType);
    setActiveLibraryButtonKey(focusKey);

    if (showLibraries) {
      return;
    }

    scheduleLibraryAutoOpen(nextType);
  }

  function handleLibraryTypePress(nextType: LibraryTypes) {
    setActiveLibraryButtonKey(LIBRARY_TYPE_BUTTONS[nextType]);
    openLibraries(nextType);
  }

  function handleNonLibraryFocus() {
    clearAutoOpenTimeout();
  }

  function hideLibraries() {
    clearAutoOpenTimeout();
    preventNextAutoOpenFocusKeyRef.current = activeLibraryButtonKey;
    focusToRestoreRef.current = activeLibraryButtonKey;
    setShowLibraries(false);
  }

  useEffect(() => {
    setFocus(NavigationFocusKeys.topBar.home);
  }, []);

  useEffect(() => {
    if (!showLibraries) {
      if (focusToRestoreRef.current) {
        const focusKey = focusToRestoreRef.current;

        focusToRestoreRef.current = null;

        const focusFrame = window.requestAnimationFrame(() => {
          setFocus(focusKey);
        });

        return () => window.cancelAnimationFrame(focusFrame);
      }

      return;
    }

    if (selectedLibraries.length === 0) {
      return;
    }

    const focusFrame = window.requestAnimationFrame(() => {
      setFocus(selectedLibraries[0].id);
    });

    return () => window.cancelAnimationFrame(focusFrame);
  }, [selectedLibraries, showLibraries]);

  useEffect(() => {
    return () => {
      if (autoOpenTimeoutRef.current) {
        window.clearTimeout(autoOpenTimeoutRef.current);
        autoOpenTimeoutRef.current = null;
      }
    };
  }, []);

  return (
    <NavigationContainer
      customFocusKey={NavigationFocusKeys.topBar.container}
      className="relative flex justify-between items-center w-screen py-8 z-10"
    >
      <img src="/Seerial_logo.svg" alt="Logo" className="w-[5dvh] ml-5" />
      <div className="flex flex-1 justify-center">
        <AnimatePresence initial={false} mode="wait">
          {!showLibraries && (
            <motion.div
              key="top-bar-actions"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="flex gap-6"
            >
              <NavigationButton
                customKey={NavigationFocusKeys.topBar.home}
                text="Home"
                selected={pathname === '/home'}
                onFocus={handleNonLibraryFocus}
                onClick={() => navigate('/home')}
                variant="ghost"
              />
              <NavigationButton
                customKey={LIBRARY_TYPE_BUTTONS[LibraryTypes.MOVIES]}
                disabled={!showMovies}
                selected={pathname.split('/').pop() === LibraryTypes.MOVIES}
                onFocus={() => handleLibraryTypeFocus(LibraryTypes.MOVIES)}
                onClick={() => handleLibraryTypePress(LibraryTypes.MOVIES)}
                text="Movies"
                variant="ghost"
              />
              <NavigationButton
                customKey={LIBRARY_TYPE_BUTTONS[LibraryTypes.SHOWS]}
                disabled={!showSeries}
                selected={pathname.split('/').pop() === LibraryTypes.SHOWS}
                onFocus={() => handleLibraryTypeFocus(LibraryTypes.SHOWS)}
                onClick={() => handleLibraryTypePress(LibraryTypes.SHOWS)}
                text="Shows"
                variant="ghost"
              />
              <NavigationButton
                customKey={LIBRARY_TYPE_BUTTONS[LibraryTypes.MUSIC]}
                disabled={!showMusic}
                selected={pathname.split('/').pop() === LibraryTypes.MUSIC}
                onFocus={() => handleLibraryTypeFocus(LibraryTypes.MUSIC)}
                onClick={() => handleLibraryTypePress(LibraryTypes.MUSIC)}
                text="Music"
                variant="ghost"
              />
              <NavigationButton
                customKey={NavigationFocusKeys.topBar.myList}
                selected={pathname === '/myList'}
                onFocus={handleNonLibraryFocus}
                onClick={() => navigate('/myList')}
                text="My List"
                variant="ghost"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div>
        <NavigationButton
          customKey={NavigationFocusKeys.topBar.settings}
          onFocus={handleNonLibraryFocus}
          className="mr-5"
          variant="ghost"
        >
          <Settings size={'3dvh'} />
        </NavigationButton>
      </div>

      <AnimatePresence>
        {showLibraries && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2"
          >
            <ChevronUp className="text-white/80" size={'2.5dvh'} />
          </motion.div>
        )}
      </AnimatePresence>

      <LibrariesList
        type={libraryType}
        libraries={selectedLibraries}
        show={showLibraries}
        hide={hideLibraries}
      />
    </NavigationContainer>
  );
}

export default memo(TopBar);
