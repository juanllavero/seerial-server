import { useGradientStore } from '@seerial/stores';
import { AnimatePresence, domAnimation, LazyMotion, m } from 'framer-motion';
import { memo, type ReactElement, useEffect, useReducer, useRef } from 'react';
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

interface TopBarLayoutState {
  renderedOutlet: OutletSnapshot;
  isPageVisible: boolean;
  renderedHideTopBar: boolean;
}

type TopBarLayoutAction =
  | { type: 'sync-current'; outlet: OutletSnapshot; hideTopBar: boolean }
  | { type: 'queue-next'; outlet: OutletSnapshot; hideTopBar: boolean }
  | { type: 'commit-next'; outlet: OutletSnapshot; hideTopBar: boolean };

function topBarLayoutReducer(
  state: TopBarLayoutState,
  action: TopBarLayoutAction,
): TopBarLayoutState {
  switch (action.type) {
    case 'sync-current':
      return {
        ...state,
        renderedOutlet: action.outlet,
        renderedHideTopBar: action.hideTopBar,
        isPageVisible: true,
      };
    case 'queue-next':
      return {
        ...state,
        isPageVisible: false,
      };
    case 'commit-next':
      return {
        ...state,
        renderedOutlet: action.outlet,
        renderedHideTopBar: action.hideTopBar,
        isPageVisible: true,
      };
    default:
      return state;
  }
}

const TopBarLayout = () => {
  const gradientImageSrc = useGradientStore((state) => state.gradientImageSrc);
  const routeLocation = useLocation();
  const outlet = useOutlet();
  const { pathname, key: routeKey } = routeLocation;
  const previousPathnameRef = useRef(pathname);
  const pendingOutletRef = useRef<OutletSnapshot | null>(null);
  const pendingHideTopBarRef = useRef<boolean | null>(null);
  const [layoutState, dispatchLayout] = useReducer(topBarLayoutReducer, {
    renderedOutlet: { key: routeKey, element: outlet },
    isPageVisible: true,
    renderedHideTopBar: false,
  });
  const { renderedOutlet, isPageVisible, renderedHideTopBar } = layoutState;

  const isMovieDetails = useMatch('details/movie/:movieId');
  const isSeriesDetails = useMatch('details/series/:seriesId');
  const isAlbumDetails = useMatch('details/album/:albumId');
  const isCollectionDetails = useMatch('details/collection/:collectionId/:type');
  const hideTopBar = !!(isMovieDetails || isSeriesDetails || isAlbumDetails || isCollectionDetails);

  useEffect(() => {
    const previousPathname = previousPathnameRef.current;

    if (previousPathname !== pathname) {
      previousPathnameRef.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    if (routeKey === renderedOutlet.key) {
      dispatchLayout({
        type: 'sync-current',
        outlet: { key: routeKey, element: outlet },
        hideTopBar,
      });
      return;
    }

    pendingOutletRef.current = { key: routeKey, element: outlet };
    pendingHideTopBarRef.current = hideTopBar;
    dispatchLayout({ type: 'queue-next', outlet: { key: routeKey, element: outlet }, hideTopBar });
  }, [routeKey, outlet, renderedOutlet.key, hideTopBar]);

  const handleExitComplete = () => {
    if (!pendingOutletRef.current) {
      return;
    }

    dispatchLayout({
      type: 'commit-next',
      outlet: pendingOutletRef.current,
      hideTopBar: pendingHideTopBarRef.current ?? false,
    });
    pendingOutletRef.current = null;
    pendingHideTopBarRef.current = null;
  };

  return (
    <LazyMotion features={domAnimation}>
      <div
        className="seerial-app-shell w-full h-full m-0 flex flex-col items-center justify-end overflow-hidden"
        style={{ backgroundColor: 'var(--seerial-app-shell-background, black)' }}
      >
        <GradientBackground imageSrc={gradientImageSrc} index={0} />
        {!renderedHideTopBar && <TopBar />}

        <AnimatePresence mode="wait" initial={false} onExitComplete={handleExitComplete}>
          {isPageVisible && (
            <m.div
              key={renderedOutlet.key}
              className="w-full flex-1 min-h-0"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              {renderedOutlet.element}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
};

export default memo(TopBarLayout);
