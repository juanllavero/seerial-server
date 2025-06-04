import Card from '@/components/cards/Card'
import { useServerStore } from '@/context/server.context'
import { Movie } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import HorizontalList from '../HorizontalList'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsMobile } from '@/components/hooks/use-mobile'

interface MyListMoviesProps {
  goToContent: (url: string) => void
}

function MyListMovies({ goToContent }: MyListMoviesProps) {
  const { t } = useTranslation()
  const { selectedServer } = useServerStore()
  const isMobile = useIsMobile()

  // Get Movies in My List
  const { data: moviesInMyList, isLoading } = useSWR<Movie[]>(
    selectedServer ? `https://${selectedServer.ip}/myListMovies` : null,
    fetcher,
  )

  const skeletons = Array.from({ length: 10 }, (_, index) => (
    <Skeleton
      key={'MyListMovies ' + index}
      className={
        isMobile ? 'h-[195px] min-w-[130px]' : 'h-[270px] min-w-[180px]'
      }
    />
  ))
  return (
    <HorizontalList title={t('watchListShows')}>
      {moviesInMyList && moviesInMyList.length > 0
        ? moviesInMyList.map((movie: Movie) => (
            <Card
              itemKey={'Home Card' + movie.id}
              imgSrc={movie.coverSrc}
              width={isMobile ? 130 : 180}
              aspectRatio={2 / 3}
              title={movie.name}
              subtitle={movie.year}
              hidePlayButton
              action={() => goToContent(`/details/movie/${movie.id}`)}
            />
          ))
        : !isLoading
          ? skeletons
          : t('noContent')}
    </HorizontalList>
  )
}

export default MyListMovies
