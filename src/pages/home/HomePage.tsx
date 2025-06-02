import Card from '@/components/cards/Card'
import Loading from '@/components/Loading'
import FlexBox from '@/components/ui/FlexBox'
import { useAuth } from '@/context/auth.context'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { Library, Movie, Series, Video } from '@/data/interfaces/Media'
import { Server } from '@/data/interfaces/Users'
import { CENTRAL_SERVER } from '@/utils/constants'
import { authenticatedFetcher, fetcher } from '@/utils/utils'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import HorizontalList from './components/HorizontalList'
import NoAPIKey from './components/NoAPIKey'
import NoContent from './components/NoContent'
import NoServer from './components/NoServer'
import NotAvailableServer from './components/NotAvailableServer'

export default function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { selectedServer, serverStatus, apiKeyStatus, getServerStatus } =
    useServerStore()
  const { selectLibrary, loadingContent } = useDataStore()

  // Get Servers
  const { data: servers, isLoading: loadingServers } = useSWR<Server[]>(
    user ? `https://${CENTRAL_SERVER}/servers/` : null,
    authenticatedFetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  )

  // Get Libraries
  const { data: libraries, isLoading: loadingLibraries } = useSWR<Library[]>(
    selectedServer ? `https://${selectedServer.ip}/libraries/` : null,
    authenticatedFetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  )

  // Get Continue Watching items
  const { data: continueWatching, isLoading: loadingContinueWatching } = useSWR<
    Video[]
  >(
    selectedServer ? `https://${selectedServer.ip}/continueWatching` : null,
    fetcher,
  )

  // Get Shows in My List
  const { data: showsInMyList, isLoading: loadingShowsInMyList } = useSWR<
    Series[]
  >(
    selectedServer ? `https://${selectedServer.ip}/myListSeries` : null,
    fetcher,
  )

  // Get Movies in My List
  const { data: moviesInMyList, isLoading: loadingMoviesInMyList } = useSWR<
    Movie[]
  >(
    selectedServer ? `https://${selectedServer.ip}/myListMovies` : null,
    fetcher,
  )

  useEffect(() => {
    getServerStatus()
    selectLibrary(null)
  }, [])

  if (loadingServers || loadingLibraries) {
    return <Loading />
  }

  if (!servers) {
    return <NoServer />
  }

  if (!serverStatus) {
    return <NotAvailableServer />
  }

  if (!apiKeyStatus) {
    return <NoAPIKey />
  }

  if (!libraries) {
    return <NoContent />
  }

  const goToContent = (url: string) => {
    navigate({
      to: url,
    })
  }

  return (
    <FlexBox
      direction="column"
      gap={1}
      padding="2rem"
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
              action={() =>
                goToContent(
                  `/details/${video.episodeId ? 'episode' : 'movie'}/${video.episodeId ? video.episodeId : video.movieId}`,
                )
              }
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
              hidePlayButton
              action={() => goToContent(`/details/series/${series.id}`)}
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
              hidePlayButton
              action={() => goToContent(`/details/movie/${movie.id}`)}
            />
          ))}
        </HorizontalList>
      )}
    </FlexBox>
  )
}
