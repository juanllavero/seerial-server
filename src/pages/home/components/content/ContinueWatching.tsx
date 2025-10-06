import Card from '@/components/cards/Card'
import { useIsMobile } from '@/components/hooks/use-mobile'
import { Skeleton } from '@/components/ui/skeleton'
import { useServerStore } from '@/context/server.context'
import { Video } from '@/data/interfaces/Media'
import { getVideoProgress } from '@/utils/ReactUtils'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import { shallow } from 'zustand/shallow'
import HorizontalList from '../../../../components/lists/HorizontalList'
import { authenticatedFetcher } from '@/lib/auth'

interface ContinueWatchingProps {
  goToContent: (url: string) => void
}

function ContinueWatching({ goToContent }: ContinueWatchingProps) {
  const { t } = useTranslation()
  const { user, serverUrl } = useServerStore(
    (state) => ({
      user: state.currentUser,
      serverUrl: state.serverUrl,
    }),
    shallow,
  )
  const isMobile = useIsMobile()

  // Get Continue Watching items
  const { data: continueWatching, isLoading } = useSWR<Video[]>(
    serverUrl !== ''
      ? `${serverUrl}/continueWatching?userId=${user?.id ?? null}`
      : null,
    authenticatedFetcher,
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
              hideButtons
              progress={getVideoProgress(video)}
              title={`${video.title}`}
              subtitle={`${video.subtitle ? `${video.subtitle} - ` : video.date ? video.date.split('-')[0] : ''} ${
                video.seasonNumber && video.episodeNumber
                  ? `${t('seasonLetter')}${video.seasonNumber} ${t('episodeLetter')}${
                      video.episodeNumber
                    }`
                  : ''
              }`}
              action={() =>
                goToContent(
                  `/details/${video.episodeId ? 'episode' : 'movie'}/${video.episodeId ? video.episodeId : video.movieId}`,
                )
              }
              playButtonAction={() =>
                goToContent(`/video-player/${video.videoId}`)
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
