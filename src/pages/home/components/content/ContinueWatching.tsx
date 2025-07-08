import Card from '@/components/cards/Card'
import { useIsMobile } from '@/components/hooks/use-mobile'
import { Skeleton } from '@/components/ui/skeleton'
import { useServerStore } from '@/context/server.context'
import { Video } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import HorizontalList from '../../../../components/lists/HorizontalList'
import { shallow } from 'zustand/shallow'

interface ContinueWatchingProps {
  goToContent: (url: string) => void
}

function ContinueWatching({ goToContent }: ContinueWatchingProps) {
  const { t } = useTranslation()
  const { selectedServer, serverIP } = useServerStore(
    (state) => ({
      selectedServer: state.selectedServer,
      serverIP: state.serverIP,
    }),
    shallow,
  )
  const isMobile = useIsMobile()

  // Get Continue Watching items
  const { data: continueWatching, isLoading } = useSWR<Video[]>(
    selectedServer ? `http://${serverIP}/continueWatching` : null,
    fetcher,
  )

  const skeletons = Array.from({ length: 10 }, (_, index) => (
    <Skeleton
      key={'ContinueWatching ' + index}
      className={
        isMobile ? 'h-[158px] min-w-[280px]' : 'h-[214px] min-w-[380px]'
      }
    />
  ))
  return (
    <HorizontalList title={t('continueWatching')}>
      {continueWatching && continueWatching.length > 0
        ? continueWatching.map((video: Video) => (
            <Card
              itemKey={'Home Card' + video.id}
              imgSrc={video.imgSrc}
              aspectRatio={16 / 9}
              width={isMobile ? 280 : 380}
              title={video.title}
              subtitle={'Not yet'}
              action={() =>
                goToContent(
                  `/server/${selectedServer?.id}/details/${video.episodeId ? 'episode' : 'movie'}/${video.episodeId ? video.episodeId : video.movieId}`,
                )
              }
            />
          ))
        : isLoading
          ? skeletons
          : t('continueWatchingEmpty')}
    </HorizontalList>
  )
}

export default ContinueWatching
