import Card from '@/components/cards/Card'
import { useIsMobile } from '@/components/hooks/use-mobile'
import { useServerStore } from '@/context/server.context'
import { Movie } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import HorizontalList from '../../../../components/lists/HorizontalList'
import HorizontalListSkeleton from './HorizontalListSkeleton'
import { shallow } from 'zustand/shallow'

interface MyListMoviesProps {
  goToContent: (url: string) => void
}

function MyListMovies({ goToContent }: MyListMoviesProps) {
  const { t } = useTranslation()
  const { selectedServer, serverIP } = useServerStore(
    (state) => ({
      selectedServer: state.selectedServer,
      serverIP: state.serverIP,
    }),
    shallow,
  )
  const isMobile = useIsMobile()

  // Get Movies in My List
  const { data: moviesInMyList, isLoading } = useSWR<Movie[]>(
    selectedServer ? `http://${serverIP}/myListMovies` : null,
    fetcher,
  )

  return (
    <HorizontalList title={t('watchListMovies')}>
      {isLoading ? (
        <HorizontalListSkeleton listType="MyListMovies" />
      ) : moviesInMyList && moviesInMyList.length > 0 ? (
        moviesInMyList.map((movie: Movie) => (
          <Card
            itemKey={'Home Card' + movie.id}
            imgSrc={movie.coverSrc}
            width={isMobile ? 130 : 180}
            aspectRatio={2 / 3}
            title={movie.name}
            subtitle={
              movie.year ? new Date(movie.year).getFullYear().toString() : 'N/A'
            }
            hidePlayButton
            action={() =>
              goToContent(
                `/server/${selectedServer?.id}/details/movie/${movie.id}`,
              )
            }
          />
        ))
      ) : (
        t('noContent')
      )}
    </HorizontalList>
  )
}

export default MyListMovies
