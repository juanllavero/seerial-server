import { useIsMobile } from '@/components/hooks/use-mobile'
import NotFound from '@/components/NotFound'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { MarkWatchedIcon, UnmarkWatchedIcon } from '@/components/ui/IconLibrary'
import LazyImage from '@/components/ui/LazyImage'
import { Skeleton } from '@/components/ui/skeleton'
import useDataStore from '@/context/data.context'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useSettingsStore } from '@/context/settings.context'
import { useWebSocketStore } from '@/context/ws.context'
import { MessageType } from '@/data/enums/WSMessage'
import { Series } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import { t } from 'i18next'
import { Edit, Ellipsis } from 'lucide-react'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import CastList from '../components/CastList'
import SeasonContent from '../components/SeasonsContent'
import '../DetailsPage.css'
import MyListButton from './components/MyListButton'
import PlayButton from './components/PlayButton'
import { shallow } from 'zustand/shallow'

function SeriesDetailsPage() {
  const { seriesId } = useParams()
  const {
    selectedSeasonId,
    selectSeason,
    setCurrentBackground,
    currentBackground,
  } = useDataStore(
    (state) => ({
      selectedSeasonId: state.selectedSeasonId,
      selectSeason: state.selectSeason,
      setCurrentBackground: state.setCurrentBackground,
      currentBackground: state.currentBackground,
    }),
    shallow,
  )
  const wsMessage = useWebSocketStore((state) => state.wsMessage)
  const selectedServer = useServerStore((state) => state.selectedServer)
  const clientSettings = useSettingsStore((state) => state.clientSettings)
  const openSeasonDialog = useDialogStore((state) => state.openSeasonDialog)
  const serverIP = selectedServer?.ip

  // Get series data
  const {
    data: series,
    isLoading,
    error,
    mutate: mutateSeries,
  } = useSWR<Series>(
    `https://${serverIP}/details/series?id=${seriesId}`,
    fetcher,
  )

  // Get selected season data
  const season = series
    ? series.seasons.find((s) => s.id === selectedSeasonId)
    : undefined

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
    if (
      wsMessage === MessageType.MUTATE_SERIES ||
      wsMessage === MessageType.MUTATE_SEASON
    ) {
      mutateSeries()
    }
  }, [wsMessage, mutateSeries])

  useEffect(() => {
    if (
      !isLoading &&
      series &&
      ((season && season.id !== selectedSeasonId) || !season)
    ) {
      selectSeason(
        series.seasons && series.seasons.length > 0
          ? series.seasons[0].id
          : null,
      )
    }
  }, [series, season, isLoading, selectedSeasonId, selectSeason])

  // Set background image src
  useEffect(() => {
    if (season && season.backgroundSrc !== currentBackground) {
      setCurrentBackground(season.backgroundSrc)
    }
    // } else if (currentBackground) {
    //   setCurrentBackground(undefined)
    // }
  }, [season, setCurrentBackground, currentBackground])

  const renderLogoOrText = () => {
    if (isLoading || !series) {
      return <Skeleton style={{ width: '350px', height: '200px' }} />
    }

    const logoUrl = series.logoSrc

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
          {series.name}
        </span>
      )
    }
  }

  const toggleSeriesWatched = async () => {
    if (series) {
      fetch(`https://${serverIP}/setSeriesWatched`, {
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
      })
    }
  }

  const toggleSeasonWatched = async () => {
    if (season) {
      fetch(`https://${serverIP}/setSeasonWatched`, {
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
      })
    }
  }

  if (error) {
    return <NotFound />
  }

  return (
    <FlexBox
      className="details-container"
      direction="column"
      gap={1}
      wrap="nowrap"
      padding={isMobile ? '3rem 0' : '2rem 3rem 5rem 3rem'}
      height={'100%'}
    >
      <FlexBox justify="start" align="start" gap={4}>
        {!isMobile && (
          <div className="cover-container">
            {showPoster &&
              (isLoading || !series ? (
                <FlexBox className="image-container">
                  <Skeleton style={{ height: '495px', width: '330px' }} />
                </FlexBox>
              ) : (
                <FlexBox className="image-container">
                  <LazyImage
                    url={series.coverSrc}
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

          {/* Season Title */}
          {isLoading || !series ? (
            <Skeleton className="h-8 w-60" />
          ) : series.seasons && series.seasons.length > 1 && season ? (
            <span id="seasonTitle" className="text-2xl font-bold">
              {season.name}
            </span>
          ) : null}

          {/* Info */}
          <FlexBox direction="column" gap={0.2}>
            <FlexBox gap={1.3} margin="0 0 0.3rem 0">
              <span id="date">
                {isLoading || !series ? (
                  <Skeleton className="h-5 w-20" />
                ) : season ? (
                  new Date(season.year).getFullYear()
                ) : null}
              </span>
            </FlexBox>
            <span id="genres">
              {isLoading ? (
                <Skeleton className="h-5 w-40" />
              ) : series && series.genres && series.genres.length > 0 ? (
                series.genres.join(', ') || ''
              ) : null}
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
              {isLoading ? (
                <Skeleton className="h-5 w-8" />
              ) : series ? (
                series.score.toFixed(2)
              ) : (
                'N/A'
              )}
            </span>
          </FlexBox>
          <FlexBox gap={1} wrap="wrap">
            <PlayButton
              serverIP={serverIP ?? ''}
              currentlyWatchingEpisodeId={
                series ? series.currentlyWatchingEpisodeId : undefined
              }
            />
            {!isMobile && (
              <>
                <Button
                  variant={'ghost'}
                  title={
                    season && season.watched
                      ? t('markUnwatched')
                      : t('markWatched')
                  }
                  onClick={toggleSeasonWatched}
                >
                  {season && season.watched ? (
                    <UnmarkWatchedIcon />
                  ) : (
                    <MarkWatchedIcon />
                  )}
                </Button>
                <MyListButton
                  serverIP={serverIP ?? ''}
                  seriesId={seriesId ?? ''}
                />
              </>
            )}
            <Button
              variant={'ghost'}
              title={t('editButton')}
              onClick={() => {
                if (season) {
                  openSeasonDialog(season)
                }
              }}
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
            <span className="max-w-300 font-semibold">
              {isLoading ? (
                <Skeleton className="h-30 w-90" />
              ) : season ? (
                season.overview
              ) : series ? (
                series.overview
              ) : (
                ''
              )}
            </span>
          </FlexBox>
        </FlexBox>
      </FlexBox>

      {/* Season Content */}
      {isLoading || !series || !season ? (
        <Skeleton className="h-300 w-200" />
      ) : (
        <SeasonContent
          seasonList={series.seasons}
          serverIP={serverIP ?? ''}
          serverId={selectedServer?.id ?? ''}
        />
      )}

      {/* Cast */}
      {isLoading || !series ? (
        <Skeleton className="h-100 w-200" />
      ) : (
        <CastList cast={series.cast ?? []} />
      )}
    </FlexBox>
  )
}

export default SeriesDetailsPage
