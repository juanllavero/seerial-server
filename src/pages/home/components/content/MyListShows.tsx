import Card from '@/components/cards/Card'
import { useIsMobile } from '@/components/hooks/use-mobile'
import { useServerStore } from '@/context/server.context'
import { Series } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import HorizontalList from '../../../../components/lists/HorizontalList'
import HorizontalListSkeleton from './HorizontalListSkeleton'

interface MyListShowsProps {
  goToContent: (url: string) => void
}

function MyListShows({ goToContent }: MyListShowsProps) {
  const { t } = useTranslation()
  const selectedServer = useServerStore((state) => state.selectedServer)
  const isMobile = useIsMobile()

  // Get Shows in My List
  const { data: showsInMyList, isLoading } = useSWR<Series[]>(
    selectedServer ? `https://${selectedServer.ip}/myListSeries` : null,
    fetcher,
  )

  return (
    <HorizontalList title={t('watchListShows')}>
      {isLoading ? (
        <HorizontalListSkeleton listType="MyListShows" />
      ) : showsInMyList && showsInMyList.length > 0 ? (
        showsInMyList.map((series: Series) => (
          <Card
            itemKey={'Home Card' + series.id}
            imgSrc={series.coverSrc}
            width={isMobile ? 130 : 180}
            aspectRatio={2 / 3}
            title={series.name}
            subtitle={
              series.year
                ? new Date(series.year).getFullYear().toString()
                : 'N/A'
            }
            hidePlayButton
            action={() =>
              goToContent(
                `/server/${selectedServer?.id}/details/series/${series.id}`,
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

export default MyListShows
