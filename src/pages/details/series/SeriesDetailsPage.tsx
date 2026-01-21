import ExpandableText from '@/components/ExpandableText'
import { useIsMobile } from '@/components/hooks/use-mobile'
import NotFound from '@/components/NotFound'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { MarkWatchedIcon, UnmarkWatchedIcon } from '@/components/ui/IconLibrary'
import LazyImage from '@/components/ui/LazyImage'
import { Skeleton } from '@/components/ui/skeleton'
import { API, authenticatedFetch, authenticatedFetcher } from '@/config/api'
import useDataStore from '@/context/data.context'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useSettingsStore } from '@/context/settings.context'
import { Series } from '@/data/interfaces/Media'
import { APIResponse } from '@/data/interfaces/Utils'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { t } from 'i18next'
import { Pencil } from 'lucide-react'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import useSWR, { mutate } from 'swr'
import { shallow } from 'zustand/shallow'
import CastList from '../components/CastList'
import SeasonContent from '../components/SeasonsContent'
import '../DetailsPage.css'
import MyListButton from './components/MyListButton'
import PlayButton from './components/PlayButton'
import SeasonSelectable from './components/SeasonSelectable'

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
  const isAdmin = useIsAdmin()
  const { user } = useServerStore(
    (state) => ({
      user: state.currentUser,
    }),
    shallow,
  )
  const clientSettings = useSettingsStore((state) => state.clientSettings)
  const openSeasonDialog = useDialogStore((state) => state.openSeasonDialog)

  // Get series data
  const {
    data: series,
    isLoading,
    error,
  } = useSWR<APIResponse<Series>>(
    `${API.series.get(seriesId ?? '')}?include=all`,
    authenticatedFetcher,
  )

  const seriesData = series ? series.data : undefined

  // Get selected season data
  const season =
    seriesData && seriesData.seasons
      ? seriesData.seasons.find((s) => s.id === selectedSeasonId)
      : undefined

  const isMobile = useIsMobile()
  const showPoster: boolean = (clientSettings['showPosters'] as boolean) ?? true

  useEffect(() => {
    if (
      !isLoading &&
      seriesData &&
      ((season && season.id !== selectedSeasonId) || !season)
    ) {
      selectSeason(
        seriesData.seasons && seriesData.seasons.length > 0
          ? seriesData.seasons[0].id
          : null,
      )
    }
  }, [seriesData, season, isLoading, selectedSeasonId, selectSeason])

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
    if (isLoading || !seriesData) {
      return <Skeleton style={{ width: '350px', height: '200px' }} />
    }

    const logoUrl = seriesData.logoSrc

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
          {seriesData.name}
        </span>
      )
    }
  }

  const toggleSeasonWatched = async () => {
    if (season) {
      authenticatedFetch(API.seasons.setWatchState(season.id), 'POST', {
        seasonId: season.id,
        watched: !season.watchStatus,
        userId: user?.id,
      }).then(() => {
        mutate((key: string) => key.startsWith(API.series.get(seriesId ?? '')))
        mutate((key: string) => key.startsWith(API.seasons.get(season.id)))
      })
    }
  }

  const selectSeasonOption = (key: string, _value: string) => {
    selectSeason(seriesData?.seasons[Number(key)]?.id || null)
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
              (isLoading || !seriesData ? (
                <FlexBox className="image-container">
                  <Skeleton style={{ height: '495px', width: '330px' }} />
                </FlexBox>
              ) : (
                <FlexBox className="image-container">
                  <LazyImage
                    url={seriesData.coverSrc}
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
          {isLoading || !seriesData ? (
            <Skeleton className="h-8 w-60" />
          ) : seriesData.seasons && seriesData.seasons.length > 1 && season ? (
            <SeasonSelectable
              defaultValue={season ? season.name : seriesData.seasons[0].name}
              options={seriesData.seasons
                .sort((a, b) => a.seasonNumber - b.seasonNumber)
                .map((season, index) => {
                  return {
                    key: String(index),
                    value: season.name,
                  }
                })}
              onValueChange={selectSeasonOption}
            />
          ) : null}

          {/* Info */}
          <FlexBox direction="column" gap={0.2}>
            <FlexBox gap={1.3} margin="0 0 0.3rem 0">
              <span id="date">
                {isLoading || !seriesData ? (
                  <Skeleton className="h-5 w-20" />
                ) : season ? (
                  new Date(season.year).getFullYear()
                ) : null}
              </span>
            </FlexBox>
            <span id="genres">
              {isLoading ? (
                <Skeleton className="h-5 w-40" />
              ) : seriesData &&
                seriesData.genres &&
                seriesData.genres.length > 0 ? (
                seriesData.genres.join(', ') || ''
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
              ) : seriesData ? (
                seriesData.score.toFixed(2)
              ) : (
                'N/A'
              )}
            </span>
          </FlexBox>
          <FlexBox gap={1} wrap="wrap">
            <PlayButton
              selectedSeasonId={selectedSeasonId}
              currentlyWatchingEpisodeId={
                seriesData ? seriesData.currentlyWatchingEpisodeId : undefined
              }
            />
            {!isMobile && (
              <>
                <Button
                  variant={'ghost'}
                  title={
                    season && season.watchStatus
                      ? t('markUnwatched')
                      : t('markWatched')
                  }
                  onClick={toggleSeasonWatched}
                >
                  {season && season.watchStatus ? (
                    <UnmarkWatchedIcon />
                  ) : (
                    <MarkWatchedIcon />
                  )}
                </Button>
                <MyListButton seriesId={seriesId ?? ''} />
              </>
            )}
            {isAdmin && (
              <Button
                variant={'ghost'}
                title={t('editButton')}
                onClick={() => {
                  if (season) {
                    openSeasonDialog(season)
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
            <span className="max-w-300 font-semibold">
              {isLoading ? (
                <Skeleton className="h-30 w-90" />
              ) : season ? (
                <ExpandableText text={season.overview} />
              ) : seriesData ? (
                <ExpandableText text={seriesData.overview} />
              ) : (
                ''
              )}
            </span>
          </FlexBox>
        </FlexBox>
      </FlexBox>

      {/* Season Content */}
      {isLoading || !seriesData || !season ? (
        <Skeleton className="h-300 w-200" />
      ) : (
        <SeasonContent seasonList={seriesData.seasons} />
      )}

      {/* Cast */}
      {isLoading || !seriesData ? (
        <Skeleton className="h-100 w-200" />
      ) : (
        <CastList cast={seriesData.cast ?? []} />
      )}
    </FlexBox>
  )
}

export default SeriesDetailsPage
