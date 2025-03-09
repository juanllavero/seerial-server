import FlexBox from '@/components/ui/FlexBox'
import LazyImage from '@/components/ui/LazyImage'
import useDataStore from '@/context/data.context'
import { useNavigate, useParams } from '@tanstack/react-router'
import './DetailsPage.css'
import React from 'react'
import { Bookmark, Edit, Ellipsis, Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import SeasonsContent from './components/SeasonsContent'
import { formatTimeForView } from '@/utils/ReactUtils'
import CastList from './components/CastList'
import NotFound from '@/components/NotFound'

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
  } = useDataStore()
  const { t } = useTranslation()

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
        <FlexBox className="image-container">
          <LazyImage url={posterUrl} width={400} maxHeight={550} />
        </FlexBox>

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
            <Button>
              <FlexBox align="center" gap={0.5}>
                <Play />
                Reproducir
              </FlexBox>
            </Button>
            <Button
              variant={'ghost'}
              title={
                selectedSeason.watched ? t('markUnwatched') : t('markWatched')
              }
              onClick={
                () => {}
                // dispatch(
                //   setSeasonWatched({
                //     libraryId: selectedLibrary.id,
                //     seriesId: selectedSeries.id,
                //     seasonId: selectedSeason.id,
                //     watched: !selectedSeason.watched,
                //   }),
                // )
              }
            >
              {selectedSeason.watched ? <Bookmark /> : <Bookmark />}
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

      <CastList />
    </FlexBox>
  )
}

export default DetailsPage
