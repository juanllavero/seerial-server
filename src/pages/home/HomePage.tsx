import Card from '@/components/cards/Card'
import Loading from '@/components/Loading'
import FlexBox from '@/components/ui/FlexBox'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { Movie, Series, Video } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import HorizontalList from './components/HorizontalList'
import NoAPIKey from './components/NoAPIKey'
import NoContent from './components/NoContent'
import NoServer from './components/NoServer'

export default function HomePage() {
  const { t } = useTranslation()
  const { serverIP, serverStatus, apiKeyStatus, getServerStatus } =
    useServerStore()
  const { selectLibrary, isContent, loadingContent } = useDataStore()

  // Get Continue Watching items
  const { data: continueWatching, isLoading: loadingContinueWatching } = useSWR<
    Video[]
  >(`https://${serverIP}/continueWatching`, fetcher)

  // Get Shows in My List
  const { data: showsInMyList, isLoading: loadingShowsInMyList } = useSWR<
    Series[]
  >(`https://${serverIP}/myListSeries`, fetcher)

  // Get Movies in My List
  const { data: moviesInMyList, isLoading: loadingMoviesInMyList } = useSWR<
    Movie[]
  >(`https://${serverIP}/myListMovies`, fetcher)

  useEffect(() => {
    getServerStatus()
    selectLibrary(null)
  }, [])

  if (loadingContent) {
    return <Loading />
  }

  if (!serverStatus) {
    return <NoServer />
  }

  if (!apiKeyStatus) {
    return <NoAPIKey />
  }

  if (!isContent) {
    return <NoContent />
  }

  return (
    <FlexBox
      direction="column"
      gap={1}
      padding="7rem 2rem 2rem 2rem"
      scroll="vertical"
      height="100%"
    >
      {(!continueWatching || continueWatching.length === 0) &&
        (!showsInMyList || showsInMyList.length === 0) &&
        (!moviesInMyList || moviesInMyList.length === 0) && (
          <h1>{t('noResults')}</h1>
        )}
      {/* Continue Watching */}
      {continueWatching && continueWatching.length > 0 && (
        <HorizontalList title={t('continueWatching')}>
          {continueWatching.map((video: Video) => (
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
      )}

      {/* User's Shows in WatchList */}
      {showsInMyList && showsInMyList.length > 0 && (
        <HorizontalList title={t('watchList')}>
          {showsInMyList.map((series: Series) => (
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
      )}

      {/* User's Movies in WatchList */}
      {moviesInMyList && moviesInMyList.length > 0 && (
        <HorizontalList title={t('watchList')}>
          {moviesInMyList.map((movie: Movie) => (
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
      )}
    </FlexBox>
  )
}
