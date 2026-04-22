import { useGetLibraries } from '@seerial/api';
import { type Library, LibraryTypes } from '@seerial/domain';
import { useGradientStore, useServerStore } from '@seerial/stores';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useMatch } from 'react-router-dom';
import { GradientBackground } from '@/shared/components/backgrounds';
import TopBar from './components/top-bar';

type TransitionDirection = 1 | -1;

const ROUTE_ORDER = {
  home: 0,
  [LibraryTypes.MOVIES]: 1,
  [LibraryTypes.SHOWS]: 2,
  [LibraryTypes.MUSIC]: 3,
  toSee: 4,
} as const;

type RoutePosition = {
  order: number;
  type?: LibraryTypes;
  libraryIndex?: number;
};

function normalizeLibraryType(rawType: string): LibraryTypes | null {
  if (rawType === LibraryTypes.MOVIES) {
    return LibraryTypes.MOVIES;
  }

  if (rawType === LibraryTypes.SHOWS) {
    return LibraryTypes.SHOWS;
  }

  if (rawType === LibraryTypes.MUSIC) {
    return LibraryTypes.MUSIC;
  }

  return null;
}

function getLibraryIndex(libraries: Library[], type: LibraryTypes, libraryId: string): number {
  const librariesForType = libraries.filter((library) => library.type === type);
  const index = librariesForType.findIndex((library) => library.id === libraryId);

  return index >= 0 ? index : 0;
}

function getRoutePosition(pathname: string, libraries: Library[]): RoutePosition {
  if (pathname === '/home') {
    return { order: ROUTE_ORDER.home };
  }

  if (pathname === '/see') {
    return { order: ROUTE_ORDER.toSee };
  }

  const pathSegments = pathname.split('/').filter(Boolean);
  const [segment, libraryId, rawType] = pathSegments;

  if (segment === 'library' && libraryId && rawType) {
    const type = normalizeLibraryType(rawType);

    if (type) {
      return {
        order: ROUTE_ORDER[type],
        type,
        libraryIndex: getLibraryIndex(libraries, type, libraryId),
      };
    }
  }

  return { order: ROUTE_ORDER.home };
}

function getTransitionDirection(
  previousPathname: string,
  nextPathname: string,
  libraries: Library[],
): TransitionDirection {
  const previous = getRoutePosition(previousPathname, libraries);
  const next = getRoutePosition(nextPathname, libraries);

  if (
    previous.type &&
    next.type &&
    previous.type === next.type &&
    previous.libraryIndex !== undefined &&
    next.libraryIndex !== undefined &&
    previous.libraryIndex !== next.libraryIndex
  ) {
    return next.libraryIndex > previous.libraryIndex ? 1 : -1;
  }

  if (next.order === previous.order) {
    return 1;
  }

  return next.order > previous.order ? 1 : -1;
}

const pageVariants = {
  initial: (direction: TransitionDirection) => ({
    x: direction === 1 ? '4%' : '-4%',
    opacity: 0,
  }),
  animate: { x: 0, opacity: 1 },
  exit: (direction: TransitionDirection) => ({
    x: direction === 1 ? '-4%' : '4%',
    opacity: 0,
  }),
};

const pageTransition = {
  duration: 0.25,
  ease: [0.25, 0.1, 0.25, 1] as const,
};

const TopBarLayout = () => {
  const gradientImageSrc = useGradientStore((state) => state.gradientImageSrc);
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');
  const location = useLocation();
  const [direction, setDirection] = useState<TransitionDirection>(1);
  const previousPathnameRef = useRef(location.pathname);

  const { data: librariesData } = useGetLibraries<Library[]>({
    enabled: serverUrl !== '',
    refetchOnWindowFocus: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const libraries = useMemo(() => librariesData ?? [], [librariesData]);

  const isMovieDetails = useMatch('details/movie/:movieId');
  const isSeriesDetails = useMatch('details/series/:seriesId');
  const isAlbumDetails = useMatch('details/album/:albumId');
  const hideTopBar = !!(isMovieDetails || isSeriesDetails || isAlbumDetails);

  useEffect(() => {
    const previousPathname = previousPathnameRef.current;

    if (previousPathname !== location.pathname) {
      const nextDirection = getTransitionDirection(previousPathname, location.pathname, libraries);

      setDirection(nextDirection);
      previousPathnameRef.current = location.pathname;
    }
  }, [libraries, location.pathname]);

  return (
    <div
      className="seerial-app-shell w-full h-full m-0 flex flex-col items-center justify-end overflow-hidden"
      style={{ backgroundColor: 'var(--seerial-app-shell-background, black)' }}
    >
      <GradientBackground imageSrc={gradientImageSrc} index={0} />
      {!hideTopBar && <TopBar />}

      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={location.key}
          className="w-full flex-1 min-h-0"
          variants={pageVariants}
          custom={direction}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default memo(TopBarLayout);
