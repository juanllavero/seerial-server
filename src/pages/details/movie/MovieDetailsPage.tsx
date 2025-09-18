import { useIsMobile } from '@/components/hooks/use-mobile'
import NotFound from '@/components/NotFound'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import {
  MarkWatchedIcon,
  PlayIcon,
  UnmarkWatchedIcon,
} from '@/components/ui/IconLibrary'
import LazyImage from '@/components/ui/LazyImage'
import { Skeleton } from '@/components/ui/skeleton'
import useDataStore from '@/context/data.context'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useSettingsStore } from '@/context/settings.context'
import { useWebSocketStore } from '@/context/ws.context'
import { MessageType } from '@/data/enums/WSMessage'
import { Movie } from '@/data/interfaces/Media'
import { formatTimeForView } from '@/utils/ReactUtils'
import { authenticatedFetcher } from '@/utils/utils'
import { t } from 'i18next'
import { Pencil } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useSWR from 'swr'
import CastList from '../components/CastList'
import MovieContent from '../components/MovieContent'
import '../DetailsPage.css'
import MyListButton from './components/MyListButton'
import { shallow } from 'zustand/shallow'
import ExpandableText from '@/components/ExpandableText'
import { useIsServerOwner } from '@/hooks/useServerOwner'
import { useAuth } from '@/context/auth.context'
import { authenticatedFetch } from '@/lib/auth'

function MovieDetailsPage() {
  const { movieId } = useParams()
  const { user } = useAuth()
  const { setCurrentBackground, currentBackground } = useDataStore(
    (state) => ({
      setCurrentBackground: state.setCurrentBackground,
      currentBackground: state.currentBackground,
    }),
    shallow,
  )
  const clientSettings = useSettingsStore((state) => state.clientSettings)
  const wsMessage = useWebSocketStore((state) => state.wsMessage)
  const openMovieDialog = useDialogStore((state) => state.openMovieDialog)
  const { selectedServer, serverUrl } = useServerStore(
    (state) => ({
      selectedServer: state.selectedServer,
      serverUrl: state.serverUrl,
    }),
    shallow,
  )
  const isServerOwner = useIsServerOwner()
  const navigate = useNavigate()

  // Get movie data
  const {
    data: movie,
    isLoading,
    error,
    mutate,
  } = useSWR<Movie>(
    `${serverUrl}/details/movie?id=${movieId}`,
    authenticatedFetcher,
  )

  const isMobile = useIsMobile()
  const showPoster: boolean = (clientSettings['showPosters'] as boolean) ?? true

  // Update selected server
  // useEffect(() => {
  //   if (server !== selectedServer) {
  //     selectServer(server)
  //   }
  // }, [])

  // Mutate content on ws message
  useEffect(() => {
    if (wsMessage === MessageType.MUTATE_MOVIE) {
      mutate()
    }
  }, [wsMessage, mutate])

  // Set background image src
  useEffect(() => {
    if (movie && movie.backgroundSrc !== currentBackground) {
      setCurrentBackground(movie.backgroundSrc)
    }
    // } else if (currentBackground) {
    //   setCurrentBackground(undefined)
    // }
  }, [movie, setCurrentBackground, currentBackground])

  const renderLogoOrText = () => {
    if (isLoading || !movie) {
      return <Skeleton style={{ width: '350px', height: '200px' }} />
    }

    const logoUrl = movie.logoSrc

    if (logoUrl && logoUrl !== '') {
      return (
        <LazyImage
          url={logoUrl}
          maxHeight={isMobile ? '100%' : 200}
          width={isMobile ? '100%' : 350}
          errorSrc="/img/Default_video_thumbnail.jpg"
        />
      )
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
      )
    }
  }

  const toggleMovieWatched = async () => {
    if (movie) {
      authenticatedFetch(`${serverUrl}/setMovieWatched`, 'POST', {
        movieId: movie.id,
        watched: !movie.watchStatus,
        userId: user?.id,
      }).then(() => {
        mutate()
      })
    }
  }

  const getPlayButtonText = () => {
    return t('playButton')
  }

  if (error) {
    return <NotFound />
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
                <span id="directedBy">
                  {t('directedBy') + ' ' + movie.directedBy || ''}
                </span>
              ) : null}
              <FlexBox gap={1.3} margin="0 0 0.3rem 0">
                <span id="date">
                  {new Date(movie.year).getFullYear() || null}
                </span>
                {movie.videos && movie.videos.length === 1 && (
                  <span>{formatTimeForView(movie.videos[0].runtime)}</span>
                )}
              </FlexBox>
              <span id="genres">
                {movie.genres ? movie.genres.join(', ') || '' : ''}
              </span>
            </FlexBox>
          )}

          {/* Score */}
          <FlexBox gap={0.5} justify="center" align="center">
            {isLoading || !movie ? (
              <Skeleton className="h-8 w-25" />
            ) : (
              <>
                {movie.imdbScore > 0 ? (
                  <img
                    src="/img/logos/imdb.png"
                    className="h-8 w-8"
                    alt="IMDB logo"
                  />
                ) : (
                  <img
                    src="/svg/themoviedb.svg"
                    className="h-8 w-8"
                    alt="TheMovieDB logo"
                  />
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
                if (movie && movie.videos && movie.videos.length > 0) {
                  navigate(
                    `/server/${selectedServer?.id}/video-player/${movie.videos[0].id}`,
                  )
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
                  title={
                    movie && movie.watchStatus
                      ? t('markUnwatched')
                      : t('markWatched')
                  }
                  onClick={toggleMovieWatched}
                >
                  {movie && movie.watchStatus ? (
                    <UnmarkWatchedIcon />
                  ) : (
                    <MarkWatchedIcon />
                  )}
                </Button>
                <MyListButton
                  movieId={movieId ?? ''}
                  serverUrl={serverUrl ?? ''}
                />
              </>
            )}
            {isServerOwner && (
              <Button
                variant={'ghost'}
                title={t('editButton')}
                onClick={() => {
                  if (movie) {
                    openMovieDialog(movie)
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
  )
}

export default MovieDetailsPage
