import { useIsMobile } from '@/components/hooks/use-mobile'
import Loading from '@/components/Loading'
import NotFound from '@/components/NotFound'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import {
  AddToListIcon,
  MarkWatchedIcon,
  PlayIcon,
  RemoveFromListIcon,
  UnmarkWatchedIcon,
} from '@/components/ui/IconLibrary'
import LazyImage from '@/components/ui/LazyImage'
import { useServerStore } from '@/context/server.context'
import { useSettingsStore } from '@/context/settings.context'
import { Movie } from '@/data/interfaces/Media'
import { formatTimeForView } from '@/utils/ReactUtils'
import { fetcher } from '@/utils/utils'
import { useNavigate, useParams } from '@tanstack/react-router'
import { t } from 'i18next'
import { Edit, Ellipsis } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import useSWR from 'swr'
import CastList from '../components/CastList'
import MovieContent from '../components/MovieContent'
import '../DetailsPage.css'

function MovieDetailsPage() {
  const { movieId } = useParams({ from: '/details/movie/$movieId' })
  const { serverIP } = useServerStore()
  const { clientSettings } = useSettingsStore()

  // Get movie data
  const { data: movie, isLoading } = useSWR<Movie>(
    movieId ? `http://${serverIP}/details/movie?id=${movieId}` : null,
    fetcher,
  )

  const isMobile = useIsMobile()
  const navigate = useNavigate()

  const [currentPoster, setCurrentPoster] = useState<string | undefined>()
  const [nextPoster, setNextPoster] = useState<string | undefined>()
  const [showAnimPoster, setShowAnimPoster] = useState(false)

  const posterUrl = movie?.coverSrc
  const showPoster: boolean = (clientSettings['showPosters'] as boolean) ?? true

  useEffect(() => {
    setNextPoster(posterUrl)
    setShowAnimPoster(true)

    setTimeout(() => {
      setCurrentPoster(posterUrl)
      setTimeout(() => {
        setShowAnimPoster(false)
      }, 100)
    }, 1000)
  }, [posterUrl])

  if (isLoading) {
    return <Loading />
  }

  if (!movie) {
    return <NotFound />
  }

  const renderLogoOrText = () => {
    const logoUrl = movie?.logoSrc

    if (logoUrl && logoUrl !== '') {
      return (
        <LazyImage
          url={logoUrl}
          maxHeight={isMobile ? '100%' : 300}
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
          {movie?.name}
        </span>
      )
    }
  }

  const getPlayButtonText = () => {
    return t('playButton')
  }

  return (
    <FlexBox
      className="details-container"
      direction="column"
      gap={1}
      wrap="nowrap"
      padding={isMobile ? '10rem 0' : '10rem 3rem'}
      height={'100%'}
    >
      <FlexBox justify="start" align="start" gap={4}>
        {!isMobile && (
          <div className="cover-container">
            {showPoster && (
              <FlexBox className="image-container">
                <LazyImage
                  url={currentPoster}
                  width={350}
                  maxHeight={550}
                  height={550}
                  errorSrc={'/img/fileNotFound.jpg'}
                />
              </FlexBox>
            )}

            {showAnimPoster && (
              <FlexBox className="image-container-animated fade-in">
                <LazyImage
                  url={nextPoster}
                  width={350}
                  maxHeight={550}
                  height={550}
                  errorSrc={'/img/fileNotFound.jpg'}
                />
              </FlexBox>
            )}
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

          {/* Score */}
          <FlexBox gap={0.5} justify="center" align="center">
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
          </FlexBox>
          <FlexBox gap={1} wrap="wrap">
            <Button
            // onClick={() => {
            //   const episodeToWatch = getEpisodeToWatch()
            //   if (episodeToWatch) {
            //     if (episodeToWatch.seasonID !== selectedSeason.id) {
            //       selectSeason(
            //         selectedSeries.seasons.find(
            //           (s) => s.id === episodeToWatch.seasonID,
            //         ) ?? selectedSeason,
            //       )
            //     }
            //     navigate({
            //       to: `/video-player/${libraryId}/${seriesId}/${episodeToWatch.seasonID}/${episodeToWatch.id}`,
            //     })
            //   }
            // }}
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
                  title={movie.watched ? t('markUnwatched') : t('markWatched')}
                >
                  {movie.watched ? <UnmarkWatchedIcon /> : <MarkWatchedIcon />}
                </Button>
                <Button
                  variant={'ghost'}
                  title={movie.watched ? t('markUnwatched') : t('markWatched')}
                >
                  {movie.watched ? <RemoveFromListIcon /> : <AddToListIcon />}
                </Button>
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
              {movie.overview || t('defaultOverview')}
            </span>
          </FlexBox>
        </FlexBox>
      </FlexBox>

      <MovieContent movie={movie} />

      <CastList cast={movie.cast ?? []} />
    </FlexBox>
  )
}

export default MovieDetailsPage
