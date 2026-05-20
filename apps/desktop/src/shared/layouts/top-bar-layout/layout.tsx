import { useGradientStore } from '@seerial/stores';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, type ReactElement, useEffect, useRef, useState } from 'react';
import { useLocation, useMatch, useOutlet } from 'react-router-dom';
import { GradientBackground } from '@/shared/components/backgrounds';
import TopBar from './components/top-bar';

const pageVariants = {
  initial: () => ({
    opacity: 0,
  }),
  animate: { x: 0, opacity: 1 },
  exit: () => ({
    opacity: 0,
  }),
};

const pageTransition = {
  duration: 0.25,
  ease: [0.25, 0.1, 0.25, 1] as const,
};

type OutletSnapshot = {
  key: string;
  element: ReactElement | null;
};

const TopBarLayout = () => {
  const gradientImageSrc = useGradientStore((state) => state.gradientImageSrc);
  const location = useLocation();
  const outlet = useOutlet();
  const previousPathnameRef = useRef(location.pathname);
  const pendingOutletRef = useRef<OutletSnapshot | null>(null);
  const pendingHideTopBarRef = useRef<boolean | null>(null);
  const [renderedOutlet, setRenderedOutlet] = useState<OutletSnapshot>(() => ({
    key: location.key,
    element: outlet,
  }));
  const [isPageVisible, setIsPageVisible] = useState(true);

  const isMovieDetails = useMatch('details/movie/:movieId');
  const isSeriesDetails = useMatch('details/series/:seriesId');
  const isAlbumDetails = useMatch('details/album/:albumId');
  const isCollectionDetails = useMatch('details/collection/:collectionId/:type');
  const hideTopBar = !!(isMovieDetails || isSeriesDetails || isAlbumDetails || isCollectionDetails);
  const [renderedHideTopBar, setRenderedHideTopBar] = useState(hideTopBar);

  useEffect(() => {
    const previousPathname = previousPathnameRef.current;

    if (previousPathname !== location.pathname) {
      previousPathnameRef.current = location.pathname;
    }
  }, [location.pathname]);

  useEffect(() => {
    if (location.key === renderedOutlet.key) {
      setRenderedOutlet({ key: location.key, element: outlet });
      setRenderedHideTopBar(hideTopBar);
      return;
    }

    pendingOutletRef.current = { key: location.key, element: outlet };
    pendingHideTopBarRef.current = hideTopBar;
    setIsPageVisible(false);
  }, [location.key, outlet, renderedOutlet.key, hideTopBar]);

  const handleExitComplete = () => {
    if (!pendingOutletRef.current) {
      return;
    }

    setRenderedOutlet(pendingOutletRef.current);
    pendingOutletRef.current = null;
    setRenderedHideTopBar(pendingHideTopBarRef.current ?? false);
    pendingHideTopBarRef.current = null;
    setIsPageVisible(true);
  };

  return (
    <div
      className="seerial-app-shell w-full h-full m-0 flex flex-col items-center justify-end overflow-hidden"
      style={{ backgroundColor: 'var(--seerial-app-shell-background, black)' }}
    >
      <GradientBackground imageSrc={gradientImageSrc} index={0} />
      {!renderedHideTopBar && <TopBar />}

      <AnimatePresence mode="wait" initial={false} onExitComplete={handleExitComplete}>
        {isPageVisible && (
          <motion.div
            key={renderedOutlet.key}
            className="w-full flex-1 min-h-0"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            {renderedOutlet.element}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(TopBarLayout);
