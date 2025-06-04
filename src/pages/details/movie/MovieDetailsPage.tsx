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
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { useSettingsStore } from '@/context/settings.context'
import { useWebSocketStore } from '@/context/ws.context'
import { MessageType } from '@/data/enums/WSMessage'
import { Movie } from '@/data/interfaces/Media'
import { formatTimeForView } from '@/utils/ReactUtils'
import { fetcher } from '@/utils/utils'
import { useLoaderData, useNavigate, useParams } from '@tanstack/react-router'
import { t } from 'i18next'
import { Edit, Ellipsis } from 'lucide-react'
import { useEffect } from 'react'
import useSWR from 'swr'
import CastList from '../components/CastList'
import MovieContent from '../components/MovieContent'
import '../DetailsPage.css'
import { Skeleton } from '@/components/ui/skeleton'
import MyListButton from './components/MyListButton'

function MovieDetailsPage() {
  const { movieId } = useParams({
    from: '/server/$serverId/details/movie/$movieId',
  })
  const { server } = useLoaderData({ from: '/server/$serverId' })
  const { setCurrentBackground, currentBackground } = useDataStore()
  const { clientSettings } = useSettingsStore()
  const { wsMessage } = useWebSocketStore()
  const { selectedServer, selectServer } = useServerStore()
  const navigate = useNavigate()
  const serverIP = server.ip

  // Get movie data
  const {
    data: movie,
    isLoading,
    error,
    mutate,
  } = useSWR<Movie>(`https://${serverIP}/details/movie?id=${movieId}`, fetcher)

  const isMobile = useIsMobile()
  const showPoster: boolean = (clientSettings['showPosters'] as boolean) ?? true

  // Update selected server
  useEffect(() => {
    if (server !== selectedServer) {
      selectServer(server)
    }
  }, [])

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
      return <Skeleton className="h-15 w-90" />
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
                  <Skeleton style={{ width: '495px', height: '330px' }} />
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
                  navigate({
                    to: `/video-player/${movie.videos[0].id}`,
                  })
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
                    movie && movie.watched
                      ? t('markUnwatched')
                      : t('markWatched')
                  }
                >
                  {movie && movie.watched ? (
                    <UnmarkWatchedIcon />
                  ) : (
                    <MarkWatchedIcon />
                  )}
                </Button>
                <MyListButton movieId={movieId} serverIP={serverIP} />
              </>
            )}
            <Button variant={'ghost'} title={t('editButton')}>
              <Edit />
            </Button>
            <Button
              variant={'ghost'}
              // onClick={(e) => {
              //   dispatch(toggleSeasonMenu())
              //   if (!seasonMenuOpen) cm.current?.show(e)
              // }}
            >
              <Ellipsis />
            </Button>
          </FlexBox>
          <FlexBox>
            <span className="font-semibold">
              {isLoading ? (
                <Skeleton className="h-30 w-90" />
              ) : movie ? (
                movie.overview
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
