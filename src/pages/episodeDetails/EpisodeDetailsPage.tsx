import Loading from '@/components/Loading'
import NotFound from '@/components/NotFound'
import FlexBox from '@/components/ui/FlexBox'
import LazyImage from '@/components/ui/LazyImage'
import useDataStore from '@/context/data.context'
import { formatDate } from '@/utils/ReactUtils'
import { useNavigate, useParams } from '@tanstack/react-router'
import React from 'react'

function EpisodeDetailsPage() {
  const navigate = useNavigate()
  const { libraryId, seriesId, seasonId, episodeId } = useParams({
    from: '/episodeDetails/$libraryId/$seriesId/$seasonId/$episodeId',
  })

  const {
    libraries,
    selectLibrary,
    selectSeries,
    selectSeason,
    selectEpisode,
    selectedLibrary,
    selectedSeries,
    selectedSeason,
    selectedEpisode,
  } = useDataStore()

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
        <span
          onClick={() => navigate({ to: `/details/${libraryId}/${seriesId}` })}
          className="cursor-pointer"
        >
          {selectedSeries.name}
        </span>
        <span>{selectedEpisode.name}</span>
        <span>
          {formatDate(selectedEpisode.year)} {selectedEpisode.runtime}
        </span>
        <span>{selectedEpisode.overview}</span>
      </FlexBox>
    </FlexBox>
  )
}

export default EpisodeDetailsPage
