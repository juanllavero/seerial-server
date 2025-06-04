import Card from '@/components/cards/Card'
import { useServerStore } from '@/context/server.context'
import { Series } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import HorizontalList from '../HorizontalList'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsMobile } from '@/components/hooks/use-mobile'

interface MyListShowsProps {
  goToContent: (url: string) => void
}

function MyListShows({ goToContent }: MyListShowsProps) {
  const { t } = useTranslation()
  const { selectedServer } = useServerStore()
  const isMobile = useIsMobile()

  // Get Shows in My List
  const { data: showsInMyList, isLoading } = useSWR<Series[]>(
    selectedServer ? `https://${selectedServer.ip}/myListSeries` : null,
    fetcher,
  )

  const skeletons = Array.from({ length: 10 }, (_, index) => (
    <Skeleton
      key={'MyListShows ' + index}
      className={
        isMobile ? 'h-[195px] min-w-[130px]' : 'h-[270px] min-w-[180px]'
      }
    />
  ))
  return (
    <HorizontalList title={t('watchListMovies')}>
      {showsInMyList && showsInMyList.length > 0
        ? showsInMyList.map((series: Series) => (
            <Card
              itemKey={'Home Card' + series.id}
              imgSrc={series.coverSrc}
              width={isMobile ? 130 : 180}
              aspectRatio={2 / 3}
              title={series.name}
              subtitle={series.year}
              hidePlayButton
              action={() => goToContent(`/details/series/${series.id}`)}
            />
          ))
        : !isLoading
          ? skeletons
          : t('noContent')}
    </HorizontalList>
  )
}

export default MyListShows
