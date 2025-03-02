import FlexBox from '@/components/ui/FlexBox'
import LazyImage from '@/components/ui/LazyImage'
import useDataStore from '@/context/data.context'
import { useNavigate } from '@tanstack/react-router'
import './DetailsPage.css'
import React from 'react'
import { Bookmark, Edit, Ellipsis, Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import SeasonsContent from './components/SeasonsContent'

function DetailsPage() {
  const { selectedLibrary, selectedSeries, selectedSeason } = useDataStore()
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (!selectedLibrary || !selectedSeries || !selectedSeason) {
    navigate({ to: '/' })
    return null
  }

  const renderLogoOrText = () => {
    const logoUrl =
      selectedLibrary.type === 'Movies'
        ? selectedSeason.logoSrc
        : selectedSeries.logoSrc

    if (logoUrl && logoUrl !== '') {
      return <LazyImage url={logoUrl} maxHeight={400} width={500} />
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
      padding="2rem"
      height={'100%'}
    >
      <FlexBox justify="start" align="start" gap={4}>
        <FlexBox className="image-container">
          <LazyImage url={posterUrl} width={500} />
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
            <span id="date">
              {new Date(selectedSeason.year).getFullYear() ||
                new Date(selectedSeries.year).getFullYear() ||
                null}
            </span>
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
          <FlexBox gap={0.5} justify="center" align="center">
            <img
              src="./src/assets/svg/themoviedb.svg"
              className="h-10 w-10"
              alt="TheMovieDB logo"
            />
            <span className="font-bold">
              {(selectedLibrary.type === 'Shows'
                ? selectedSeries.score.toFixed(2)
                : selectedSeason.score.toFixed(2)) || 'N/A'}
            </span>
          </FlexBox>
          <FlexBox gap={1}>
            <Button variant={'ghost'}>
              <Play />
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
            <span>
              {selectedSeason.overview ||
                selectedSeries.overview ||
                t('defaultOverview')}
            </span>
          </FlexBox>
        </FlexBox>
      </FlexBox>

      <SeasonsContent />
    </FlexBox>
  )
}

export default DetailsPage
