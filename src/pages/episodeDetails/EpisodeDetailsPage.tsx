import Loading from '@/components/Loading'
import NotFound from '@/components/NotFound'
import FlexBox from '@/components/ui/FlexBox'
import LazyImage from '@/components/ui/LazyImage'
import SelectableWrapper from '@/components/ui/SelectableWrapper'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { formatDate } from '@/utils/ReactUtils'
import { useNavigate, useParams } from '@tanstack/react-router'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

function EpisodeDetailsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { serverIP } = useServerStore()
  const { libraryId, seriesId, seasonId, episodeId } = useParams({
    from: '/episodeDetails/$libraryId/$seriesId/$seasonId/$episodeId',
  })

  const {
    libraries,
    selectLibrary,
    selectSeries,
    selectSeason,
    selectEpisode,
    updateEpisode,
    selectedLibrary,
    selectedSeries,
    selectedSeason,
    selectedEpisode,
  } = useDataStore()

  useEffect(() => {
    if (
      !selectedLibrary ||
      !selectedSeries ||
      !selectedSeason ||
      !selectedEpisode ||
      selectedEpisode.mediaInfo
    )
      return

    const fetchData = async () => {
      const result = await fetch(`https://${serverIP}/updateMediaInfo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          episode: selectedEpisode,
        }),
      })

      if (!result.ok) {
        return
      }

      const data = await result.json()

      updateEpisode({
        libraryId: selectedLibrary.id,
        showId: selectedSeries.id,
        episode: data,
      })
    }

    fetchData()
  }, [selectedLibrary, selectedSeries, selectedSeason, selectedEpisode])

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

  const season = series?.seasons.find((season) => season.id === seasonId)

  if (seasonId !== selectedSeason?.id) {
    if (season) {
      selectSeason(season)
    } else {
      return <NotFound />
    }
  }

  const episode = season?.episodes.find((episode) => episode.id === episodeId)

  if (episodeId !== selectedEpisode?.id) {
    if (episode) {
      selectEpisode(episode)
    } else {
      return <NotFound />
    }
  }
  //#endregion

  if (
    !selectedLibrary ||
    !selectedSeries ||
    !selectedSeason ||
    !selectedEpisode
  ) {
    return <Loading />
  }

  const isShow = selectedLibrary.type === 'Shows'

  return (
    <FlexBox
      className="details-container"
      gap={1}
      wrap="nowrap"
      padding="10rem 3rem"
      height={'100%'}
    >
      <FlexBox>
        <LazyImage
          url={selectedEpisode.imgSrc}
          width={500}
          maxHeight={300}
          height={300}
          errorSrc={'/img/Default_video_thumbnail.jpg'}
        />
      </FlexBox>

      <FlexBox direction="column" gap={1}>
        <FlexBox direction="column">
          <span
            onClick={() =>
              navigate({ to: `/details/${libraryId}/${seriesId}` })
            }
            className="cursor-pointer text-4xl font-bold uppercase"
          >
            {selectedSeries.name}
          </span>
          <span className="text-2xl font-semibold">{selectedEpisode.name}</span>
        </FlexBox>
        <FlexBox gap={1}>
          {isShow && (
            <span>
              {t('seasonLetter')}
              {selectedEpisode.seasonNumber}
              {t('episodeLetter')}
              {selectedEpisode.episodeNumber}
            </span>
          )}
          <span>{formatDate(selectedEpisode.year)}</span>
          <span>{selectedEpisode.runtime.toFixed()}min</span>
        </FlexBox>
        <span>{selectedEpisode.overview}</span>

        <FlexBox gap={1} padding="0 0 0 1rem">
          <FlexBox
            direction="column"
            justify="center"
            align="start"
            gap={1}
            width={'6rem'}
            height={'10rem'}
          >
            <FlexBox justify="center" align="center" height={'2rem'}>
              <span>{t('video')}</span>
            </FlexBox>
            <FlexBox justify="center" align="center" height={'2rem'}>
              <span>{t('audio')}</span>
            </FlexBox>
            <FlexBox justify="center" align="center" height={'2rem'}>
              <span>{t('subs')}</span>
            </FlexBox>
          </FlexBox>
          <FlexBox
            direction="column"
            justify="center"
            align="start"
            gap={1}
            width={'6rem'}
            height={'10rem'}
          >
            <SelectableWrapper
              defaultValue={''}
              onValueChange={function (key: string, value: string): void {
                throw new Error('Function not implemented.')
              }}
              options={[]}
            />
            <SelectableWrapper
              defaultValue={''}
              onValueChange={function (key: string, value: string): void {
                throw new Error('Function not implemented.')
              }}
              options={[]}
            />
            <SelectableWrapper
              defaultValue={''}
              onValueChange={function (key: string, value: string): void {
                throw new Error('Function not implemented.')
              }}
              options={[]}
            />
          </FlexBox>
        </FlexBox>
      </FlexBox>
    </FlexBox>
  )
}

export default EpisodeDetailsPage
