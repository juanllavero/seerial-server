import { useIsMobile } from '@/components/hooks/use-mobile'
import Loading from '@/components/Loading'
import NotFound from '@/components/NotFound'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import {
  AddToListIcon,
  MarkWatchedIcon,
  RemoveFromListIcon,
  UnmarkWatchedIcon,
} from '@/components/ui/IconLibrary'
import LazyImage from '@/components/ui/LazyImage'
import useDataStore from '@/context/data.context'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useSettingsStore } from '@/context/settings.context'
import { useWebSocketStore } from '@/context/ws.context'
import { MessageType } from '@/data/enums/WSMessage'
import { Episode, Season, Series } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import { useNavigate, useParams } from '@tanstack/react-router'
import { t } from 'i18next'
import { Edit, Ellipsis, PlayIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import useSWR from 'swr'
import CastList from '../components/CastList'
import SeasonContent from '../components/SeasonsContent'
import '../DetailsPage.css'

function SeriesDetailsPage() {
  const { seriesId } = useParams({ from: '/details/series/$seriesId' })
  const { serverIP } = useServerStore()
  const { wsMessage } = useWebSocketStore()
  const { selectedSeasonId, selectSeason, setCurrentBackground } =
    useDataStore()
  const { clientSettings } = useSettingsStore()
  const { openSeasonDialog } = useDialogStore()

  // Get series data
  const {
    data: series,
    isLoading: loadingSeries,
    mutate: mutateSeries,
  } = useSWR<Series>(
    seriesId ? `http://${serverIP}/details/series?id=${seriesId}` : null,
    fetcher,
  )
  // Get selected season data
  const {
    data: season,
    isLoading: loadingSeason,
    mutate: mutateSeason,
  } = useSWR<Season>(
    selectedSeasonId
      ? `http://${serverIP}/details/season?id=${selectedSeasonId}`
      : null,
    fetcher,
  )
  // Get current episode
  const { data: episode } = useSWR<Episode>(
    series && series.currentlyWatchingEpisodeId
      ? `http://${serverIP}/details/episode?id=${series.currentlyWatchingEpisodeId}`
      : null,
    fetcher,
  )
  // Get if show is in My List
  const { data: inMyList, mutate: mutateInMyList } = useSWR(
    series ? `http://${serverIP}/isShowInMyList?seriesId=${series.id}` : null,
    fetcher,
  )

  const isMobile = useIsMobile()
  const navigate = useNavigate()

  const [currentPoster, setCurrentPoster] = useState<string | undefined>()
  const [nextPoster, setNextPoster] = useState<string | undefined>()
  const [showAnimPoster, setShowAnimPoster] = useState(false)

  const posterUrl = series?.coverSrc
  const showPoster: boolean = (clientSettings['showPosters'] as boolean) ?? true

  // Mutate content on ws message
  useEffect(() => {
    if (wsMessage === MessageType.MUTATE_SERIES) {
      mutateSeries()
    } else if (wsMessage === MessageType.MUTATE_SEASON) {
      mutateSeason()
    }
  }, [wsMessage])

  useEffect(() => {
    if (series) {
      selectSeason(
        series.seasons && series.seasons.length > 0
          ? series.seasons[0].id
          : null,
      )
    }
  }, [series])

  // Set background image src
  useEffect(() => {
    if (season) {
      setCurrentBackground(season.backgroundSrc)
    } else {
      setCurrentBackground(undefined)
    }
  }, [season])

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

  if (loadingSeries || loadingSeason) {
    return <Loading />
  }

  if (!series || !season) {
    return <NotFound />
  }

  const renderLogoOrText = () => {
    const logoUrl = series?.logoSrc

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
          {series?.name}
        </span>
      )
    }
  }

  const getPlayButtonText = () => {
    return !episode
      ? t('playButton')
      : `${t('continueWatching')} — ${t('seasonLetter')}${episode.seasonNumber + 1}${t('episodeLetter')}${episode.episodeNumber + 1}`
  }

  const toggleSeriesWatched = async () => {
    if (series) {
      fetch(`http://${serverIP}/setSeriesWatched`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seriesId: series.id,
          watched: !series.watched,
        }),
      }).then(() => {
        mutateSeries()
        mutateSeason()
      })
    }
  }

  const toggleSeasonWatched = async () => {
    if (season) {
      fetch(`http://${serverIP}/setSeasonWatched`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seasonId: season.id,
          watched: !season.watched,
        }),
      }).then(() => {
        mutateSeries()
        mutateSeason()
      })
    }
  }

  const toggleMyList = () => {
    if (series) {
      fetch(`http://${serverIP}/updateSeriesMyList`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seriesId: series.id,
        }),
      }).then(() => {
        mutateInMyList()
      })
    }
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

          {series.seasons && series.seasons.length > 1 ? (
            <span id="seasonTitle">{season.name}</span>
          ) : null}

          {/* Info */}
          <FlexBox direction="column" gap={0.2}>
            <FlexBox gap={1.3} margin="0 0 0.3rem 0">
              <span id="date">{new Date(season.year).getFullYear()}</span>
            </FlexBox>
            <span id="genres">
              {series.genres && series.genres.length > 0
                ? series.genres.join(', ') || ''
                : ''}
            </span>
          </FlexBox>

          {/* Score */}
          <FlexBox gap={0.5} justify="center" align="center">
            <img
              src="/svg/themoviedb.svg"
              className="h-8 w-8"
              alt="TheMovieDB logo"
            />
            <span className="text-sm font-bold">
              {series.score.toFixed(2) || 'N/A'}
            </span>
          </FlexBox>
          <FlexBox gap={1} wrap="wrap">
            <Button
              onClick={async () => {
                if (episode) {
                  const response = await fetch(
                    `http://${serverIP}/video?id=${episode.id}`,
                  )

                  if (!response.ok) {
                    return
                  }

                  const data = await response.json()
                  navigate({
                    to: `/video-player/${data.videoId}`,
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
                  title={season.watched ? t('markUnwatched') : t('markWatched')}
                  onClick={toggleSeasonWatched}
                >
                  {season.watched ? <UnmarkWatchedIcon /> : <MarkWatchedIcon />}
                </Button>
                <Button
                  variant={'ghost'}
                  title={
                    inMyList && inMyList.isInMyList
                      ? t('addToMyList')
                      : t('removeFromMyList')
                  }
                  onClick={toggleMyList}
                >
                  {inMyList && inMyList.isInMyList ? (
                    <RemoveFromListIcon />
                  ) : (
                    <AddToListIcon />
                  )}
                </Button>
              </>
            )}
            <Button
              variant={'ghost'}
              title={t('editButton')}
              onClick={() => openSeasonDialog(season)}
            >
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
              {season.overview || series.overview || t('defaultOverview')}
            </span>
          </FlexBox>
        </FlexBox>
      </FlexBox>

      <SeasonContent seasonList={series.seasons} season={season} />

      <CastList cast={series.cast ?? []} />
    </FlexBox>
  )
}

export default SeriesDetailsPage
