import Card from '@/components/cards/Card'
import FlexBox from '@/components/ui/FlexBox'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { Movie, Series, Video } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import HorizontalList from './components/HorizontalList'

export default function HomePage() {
  const { t } = useTranslation()
  const { serverIP } = useServerStore()
  const { selectLibrary } = useDataStore()

  // Get Continue Watching items
  const { data: continueWatching, isLoading: loadingContinueWatching } = useSWR<
    Video[]
  >(`http://${serverIP}/continueWatching`, fetcher)

  // Get Shows in My List
  const { data: showsInMyList, isLoading: loadingShowsInMyList } = useSWR<
    Series[]
  >(`http://${serverIP}/myListSeries`, fetcher)

  // Get Movies in My List
  const { data: moviesInMyList, isLoading: loadingMoviesInMyList } = useSWR<
    Movie[]
  >(`http://${serverIP}/myListMovies`, fetcher)

  useEffect(() => {
    selectLibrary(null)
  }, [])

  return (
    <FlexBox
      direction="column"
      gap={1}
      padding="7rem 2rem 2rem 2rem"
      scroll="vertical"
      height="100%"
    >
      <h1></h1>
      {/* Continue Watching */}
      <HorizontalList title={t('continueWatching')}>
        {continueWatching &&
          continueWatching.length > 0 &&
          continueWatching.map((video: Video) => (
            <Card
              itemKey={'Home Card' + video.id}
              imgSrc={video.imgSrc}
              aspectRatio={16 / 9}
              width={380}
              title={video.title}
              subtitle={'Not yet'}
              action={function (): void {}}
            />
          ))}
      </HorizontalList>

      {/* User's Shows in WatchList */}
      <HorizontalList title={t('watchList')}>
        {showsInMyList &&
          showsInMyList.length > 0 &&
          showsInMyList.map((series: Series) => (
            <Card
              itemKey={'Home Card' + series.id}
              imgSrc={series.coverSrc}
              width={180}
              aspectRatio={2 / 3}
              title={series.name}
              subtitle={series.year}
              action={function (): void {}}
            />
          ))}
      </HorizontalList>

      {/* User's Movies in WatchList */}
      <HorizontalList title={t('watchList')}>
        {moviesInMyList &&
          moviesInMyList.length > 0 &&
          moviesInMyList.map((movie: Movie) => (
            <Card
              itemKey={'Home Card' + movie.id}
              imgSrc={movie.coverSrc}
              width={180}
              aspectRatio={2 / 3}
              title={movie.name}
              subtitle={movie.year}
              action={function (): void {}}
            />
          ))}
      </HorizontalList>
    </FlexBox>
  )
}
