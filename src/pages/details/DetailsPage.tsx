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
import useDataStore from '@/context/data.context'
import { useSettingsStore } from '@/context/settings.context'
import { formatTimeForView } from '@/utils/ReactUtils'
import { useNavigate, useParams } from '@tanstack/react-router'
import { Edit, Ellipsis } from 'lucide-react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import CastList from './components/CastList'
import SeasonsContent from './components/SeasonsContent'
import './DetailsPage.css'

function DetailsPage() {
  const { libraryId, seriesId } = useParams({
    from: '/details/$libraryId/$seriesId',
  })
  const {
    libraries,
    selectLibrary,
    selectSeries,
    selectSeason,
    selectedLibrary,
    selectedSeries,
    selectedSeason,
    setSeasonWatched,
  } = useDataStore()
  const { t } = useTranslation()
  const { clientSettings } = useSettingsStore()
  const navigate = useNavigate()

  const showPoster: boolean = (clientSettings['showPosters'] as boolean) ?? true

  //#region CHECK DATA BEFORE LOAD
  const library = libraries.find((library) => library.id === libraryId)

  if (libraryId !== selectedLibrary?.id) {
    if (library) {
      selectLibrary(library)
    } else {
      return <NotFound />
    }
  }

  if (!selectedLibrary) {
    return <NotFound />
  }

  const series = library?.series.find((series) => series.id === seriesId)

  if (seriesId !== selectedSeries?.id) {
    if (series) {
      selectSeries(series)
    } else {
      return <NotFound />
    }
  }

  if (
    !selectedSeries ||
    !selectedSeries.seasons ||
    selectedSeries.seasons.length === 0
  ) {
    return <NotFound />
  }

  if (!selectedSeason) {
    selectSeason(selectedSeries.seasons[0])
  }

  if (!selectedSeason) {
    return <NotFound />
  }
  //#endregion

  const renderLogoOrText = () => {
    const logoUrl =
      selectedLibrary.type === 'Movies'
        ? selectedSeason.logoSrc
        : selectedSeries.logoSrc

    if (logoUrl && logoUrl !== '') {
      return <LazyImage url={logoUrl} maxHeight={300} width={350} />
    } else {
      return (
        <span
          id="details-title"
          style={{
            textTransform:
              selectedLibrary.type === 'Music' ? 'capitalize' : 'uppercase',
          }}
        >
          {selectedSeries.name}
        </span>
      )
    }
  }

  const posterUrl =
    selectedLibrary.type === 'Movies'
      ? selectedSeason.coverSrc
      : selectedLibrary.type === 'Shows'
        ? selectedSeries.coverSrc
        : selectedSeries.isCollection
          ? selectedSeries.coverSrc
          : selectedSeason.coverSrc

  const getPlayButtonText = () => {
    const watchingSeason = selectedSeries.currentlyWatchingSeason
    const watchingEpisode =
      watchingSeason !== -1
        ? selectedSeries.seasons[watchingSeason].currentlyWatchingEpisode
        : -1

    if (selectedLibrary.type === 'Movies') {
      if (
        selectedSeason.episodes &&
        selectedSeason.episodes.length > 1 &&
        watchingEpisode !== -1
      ) {
        return t('continueWatching')
      } else {
        return t('playButton')
      }
    } else {
      if (watchingEpisode !== -1) {
        return `${t('continueWatching')} — ${t('seasonLetter')}${watchingSeason + 1}${t('episodeLetter')}${watchingEpisode + 1}`
      } else {
        return t('playButton')
      }
    }
  }

  const getEpisodeToWatch = () => {
    const watchingSeason = selectedSeries.currentlyWatchingSeason
    const watchingEpisode =
      watchingSeason !== -1
        ? selectedSeries.seasons[watchingSeason].currentlyWatchingEpisode
        : -1

    if (selectedLibrary.type === 'Movies') {
      if (
        selectedSeason.episodes &&
        selectedSeason.episodes.length > 1 &&
        watchingEpisode !== -1
      ) {
        return selectedSeason.episodes[watchingEpisode]
      } else {
        return selectedSeason.episodes[0]
      }
    } else {
      if (watchingEpisode !== -1) {
        return selectedSeries.seasons[watchingSeason].episodes[watchingEpisode]
      } else {
        return selectedSeries.seasons[0].episodes[0]
      }
    }
  }

  return (
    <FlexBox
      className="details-container"
      direction="column"
      gap={1}
      wrap="nowrap"
      padding="10rem 3rem"
      height={'100%'}
    >
      <FlexBox justify="start" align="start" gap={4}>
        {showPoster && (
          <FlexBox className="image-container">
            <LazyImage url={posterUrl} width={400} maxHeight={550} />
          </FlexBox>
        )}

        <FlexBox direction="column" gap={1} width={'80%'}>
          {renderLogoOrText()}
          {selectedLibrary.type == 'Shows' &&
          selectedSeries.seasons &&
          selectedSeries.seasons.length > 1 ? (
            <span id="seasonTitle">{selectedSeason.name}</span>
          ) : null}
          <FlexBox direction="column" gap={0.2}>
            {selectedSeason.directedBy &&
            selectedSeason.directedBy.length !== 0 ? (
              <span id="directedBy">
                {t('directedBy') + ' ' + selectedSeason.directedBy || ''}
              </span>
            ) : null}
            <FlexBox gap={1.3} margin="0 0 0.3rem 0">
              <span id="date">
                {new Date(selectedSeason.year).getFullYear() ||
                  new Date(selectedSeries.year).getFullYear() ||
                  null}
              </span>
              {selectedLibrary.type === 'Movies' &&
                selectedSeason.episodes &&
                selectedSeason.episodes.length === 1 && (
                  <span>
                    {formatTimeForView(selectedSeason.episodes[0].runtime)}
                  </span>
                )}
            </FlexBox>
            <span id="genres">
              {selectedLibrary.type !== 'Shows'
                ? selectedSeason.genres && selectedSeason.genres.length > 0
                  ? selectedSeason.genres.join(', ') || ''
                  : ''
                : selectedSeries.genres
                  ? selectedSeries.genres.join(', ') || ''
                  : ''}
            </span>
          </FlexBox>
          {selectedLibrary.type !== 'Music' && (
            <FlexBox gap={0.5} justify="center" align="center">
              <img
                src="/svg/themoviedb.svg"
                className="h-8 w-8"
                alt="TheMovieDB logo"
              />
              <span className="text-sm font-bold">
                {(selectedLibrary.type === 'Shows'
                  ? selectedSeries.score.toFixed(2)
                  : selectedSeason.score.toFixed(2)) || 'N/A'}
              </span>
            </FlexBox>
          )}
          <FlexBox gap={1}>
            <Button
              onClick={() => {
                const episodeToWatch = getEpisodeToWatch()
                if (episodeToWatch) {
                  if (episodeToWatch.seasonID !== selectedSeason.id) {
                    selectSeason(
                      selectedSeries.seasons.find(
                        (s) => s.id === episodeToWatch.seasonID,
                      ) ?? selectedSeason,
                    )
                  }
                  navigate({
                    to: `/video-player/${libraryId}/${seriesId}/${episodeToWatch.seasonID}/${episodeToWatch.id}`,
                  })
                }
              }}
            >
              <FlexBox align="center" gap={0.5} className="text-black">
                <PlayIcon />
                {getPlayButtonText()}
              </FlexBox>
            </Button>
            <Button
              variant={'ghost'}
              title={
                selectedSeason.watched ? t('markUnwatched') : t('markWatched')
              }
              onClick={() =>
                setSeasonWatched({
                  libraryId: selectedLibrary.id,
                  seriesId: selectedSeries.id,
                  seasonId: selectedSeason.id,
                  watched: !selectedSeason.watched,
                })
              }
            >
              {selectedSeason.watched ? (
                <UnmarkWatchedIcon />
              ) : (
                <MarkWatchedIcon />
              )}
            </Button>
            <Button
              variant={'ghost'}
              title={
                selectedSeason.watched ? t('markUnwatched') : t('markWatched')
              }
              onClick={() =>
                setSeasonWatched({
                  libraryId: selectedLibrary.id,
                  seriesId: selectedSeries.id,
                  seasonId: selectedSeason.id,
                  watched: !selectedSeason.watched,
                })
              }
            >
              {selectedSeason.watched ? (
                <RemoveFromListIcon />
              ) : (
                <AddToListIcon />
              )}
            </Button>
            <Button
              variant={'ghost'}
              title={t('editButton')}
              // onClick={() => dispatch(toggleSeasonWindow())}
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
              {selectedSeason.overview ||
                selectedSeries.overview ||
                t('defaultOverview')}
            </span>
          </FlexBox>
        </FlexBox>
      </FlexBox>

      <SeasonsContent />

      {selectedLibrary.type !== 'Music' && <CastList />}
    </FlexBox>
  )
}

export default DetailsPage
