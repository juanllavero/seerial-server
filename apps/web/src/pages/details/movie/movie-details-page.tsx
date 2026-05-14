import { useDialogStore } from '@/features/management';
import { MovieContent, CastList, MovieMyListButton as MyListButton } from '@/features/media-details';
import { useSettingsStore } from '@/features/settings';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { Button } from '@/shared/ui/button';
import ExpandableText from '@/shared/ui/expandable-text';
import FlexBox from '@/shared/ui/flex-box';
import { UnmarkWatchedIcon, MarkWatchedIcon } from '@/shared/ui/icon-library';
import LazyImage from '@/shared/ui/lazy-image';
import NotFound from '@/shared/ui/not-found';
import { Skeleton } from '@/shared/ui/skeleton';
import { useGet, API, useSetMovieWatchState } from '@seerial/api';
import { type Movie, formatTimeForView } from '@seerial/domain';
import { useIsAdmin } from '@seerial/hooks';
import { useServerStore, useDataStore } from '@seerial/stores';
import { t } from 'i18next';
import { PlayIcon, Pencil } from 'lucide-react';
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shallow } from 'zustand/shallow';

function MovieDetailsPage() {
  const { movieId } = useParams();
  const user = useServerStore((state) => state.currentUser);
  const { setCurrentBackground, currentBackground } = useDataStore(
    (state) => ({
      setCurrentBackground: state.setCurrentBackground,
      currentBackground: state.currentBackground,
    }),
    shallow,
  );
  const clientSettings = useSettingsStore((state) => state.clientSettings);
  const { openDialog } = useDialogStore((state) => ({ openDialog: state.openDialog }), shallow);
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();

  // Get movie data
  const { data: movie, isLoading, error, mutate } = useGet<Movie>(API.movies.get(movieId ?? ''));
  const { mutateAsync: setMovieWatchState } = useSetMovieWatchState<
    unknown,
    { movieId: string; watched: boolean; userId?: string }
  >(movie?.id ?? '');

  const isMobile = useIsMobile();
  const showPoster: boolean = (clientSettings.showPosters as boolean) ?? true;
  const watchList = movie?.watchLists?.find((list) => list.userId === user?.id);
  const isWatched = watchList?.watched ?? false;

  // Set background image src
  useEffect(() => {
    if (movie && movie.backgroundSrc !== currentBackground) {
      setCurrentBackground(movie.backgroundSrc);
    }
    // } else if (currentBackground) {
    //   setCurrentBackground(undefined)
    // }
  }, [movie, setCurrentBackground, currentBackground]);

  const renderLogoOrText = () => {
    if (isLoading || !movie) {
      return <Skeleton style={{ width: '350px', height: '200px' }} />;
    }

    const logoUrl = movie.logoSrc;

    if (logoUrl && logoUrl !== '') {
      return (
        <LazyImage
          url={logoUrl}
          maxHeight={isMobile ? '100%' : 200}
          width={isMobile ? '100%' : 350}
          errorSrc="/img/Default_video_thumbnail.jpg"
        />
      );
    } else {
      return (
        <span
          id="details-title"
          style={{
            textTransform: 'uppercase',
          }}
        >
          {movie.name}
        </span>
      );
    }
  };

  const toggleMovieWatched = async () => {
    if (movie) {
      await setMovieWatchState({
        movieId: movie.id,
        watched: !isWatched,
        userId: user?.id,
      });
      mutate();
    }
  };

  const getPlayButtonText = () => {
    return t('playButton');
  };

  if (error) {
    return <NotFound />;
  }

  return (
    <FlexBox
      className="details-container"
      direction="column"
      wrap="nowrap"
      padding={isMobile ? '3rem 0' : '2rem 3rem 5rem 3rem'}
      height={'100%'}
    >
      <FlexBox justify="start" align="start" gap={4}>
        {!isMobile && (
          <div className="cover-container">
            {showPoster &&
              (isLoading || !movie ? (
                <FlexBox className="image-container">
                  <Skeleton style={{ height: '495px', width: '330px' }} />
                </FlexBox>
              ) : (
                <FlexBox className="image-container">
                  <LazyImage
                    url={movie.coverSrc}
                    width={330}
                    maxHeight={495}
                    height={495}
                    errorSrc={'/img/fileNotFound.jpg'}
                  />
                </FlexBox>
              ))}
          </div>
        )}

        <FlexBox
          direction="column"
          gap={1}
          width={isMobile ? '100%' : '80%'}
          padding={isMobile ? '0 2rem' : '0'}
        >
          {renderLogoOrText()}

          {/* Info */}
          {isLoading || !movie ? (
            <FlexBox direction="column" gap={0.5}>
              <Skeleton className="h-8 w-30" />
              <FlexBox gap={1.3} margin="0 0 0.3rem 0">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
              </FlexBox>
              <Skeleton className="h-5 w-40" />
            </FlexBox>
          ) : (
            <FlexBox direction="column" gap={0.2}>
              {movie.directedBy && movie.directedBy.length !== 0 ? (
                <span id="directedBy">{`${t('directedBy')} ${movie.directedBy}` || ''}</span>
              ) : null}
              <FlexBox gap={1.3} margin="0 0 0.3rem 0">
                <span id="date">{new Date(movie.year).getFullYear() || null}</span>
                {movie.videos && movie.videos.length === 1 && (
                  <span>{formatTimeForView(movie.videos[0].runtime)}</span>
                )}
              </FlexBox>
              <span id="genres">{movie.genres ? movie.genres.join(', ') || '' : ''}</span>
            </FlexBox>
          )}

          {/* Score */}
          <FlexBox gap={0.5} justify="center" align="center">
            {isLoading || !movie ? (
              <Skeleton className="h-8 w-25" />
            ) : (
              <>
                {movie.imdbScore > 0 ? (
                  <img src="/img/logos/imdb.png" className="h-8 w-8" alt="IMDB logo" />
                ) : (
                  <img src="/svg/themoviedb.svg" className="h-8 w-8" alt="TheMovieDB logo" />
                )}
                <span className="text-sm font-bold">
                  {movie.imdbScore > 0
                    ? movie.imdbScore.toFixed(2)
                    : movie.score.toFixed(2) || 'N/A'}
                </span>
              </>
            )}
          </FlexBox>
          <FlexBox gap={1} wrap="wrap">
            <Button
              onClick={() => {
                if (movie?.videos && movie.videos.length > 0) {
                  navigate(`/video-player/${movie.videos[0].id}`);
                }
              }}
            >
              <FlexBox align="center" gap={0.5} className="text-black">
                <PlayIcon color="#111111" />
                {getPlayButtonText()}
              </FlexBox>
            </Button>
            {!isMobile && (
              <>
                <Button
                  variant={'ghost'}
                  title={isWatched ? t('markUnwatched') : t('markWatched')}
                  onClick={toggleMovieWatched}
                >
                  {isWatched ? <UnmarkWatchedIcon /> : <MarkWatchedIcon />}
                </Button>
                <MyListButton movieId={movieId ?? ''} />
              </>
            )}
            {isAdmin && (
              <Button
                variant={'ghost'}
                title={t('editButton')}
                onClick={() => {
                  if (movie) {
                    openDialog('movie', { id: movie.id });
                  }
                }}
              >
                <Pencil />
              </Button>
            )}
            {/* <Button
              variant={'ghost'}
              // onClick={(e) => {
              //   dispatch(toggleSeasonMenu())
              //   if (!seasonMenuOpen) cm.current?.show(e)
              // }}
            >
              <Ellipsis />
            </Button> */}
          </FlexBox>
          <FlexBox>
            <span className="max-w-300">
              {isLoading ? (
                <Skeleton className="h-30 w-90" />
              ) : movie ? (
                <ExpandableText text={movie.overview} />
              ) : (
                ''
              )}
            </span>
          </FlexBox>
        </FlexBox>
      </FlexBox>

      {/* Movie Content */}
      {!isLoading && movie && <MovieContent movie={movie} />}

      {/* Cast */}
      {isLoading || !movie ? (
        <Skeleton className="mt-10 h-50 w-200" />
      ) : (
        <CastList cast={movie.cast ?? []} />
      )}
    </FlexBox>
  );
}

export default MovieDetailsPage;
