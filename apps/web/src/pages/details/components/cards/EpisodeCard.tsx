import { t } from 'i18next'
import { Pencil } from 'lucide-react'
import Card from '@/components/cards/Card'
import { useIsMobile } from '@/components/hooks/use-mobile'
import { useIsTablet } from '@/components/hooks/use-tablet'
import { Button } from '@/components/ui/button'
import { useServerStore } from '@/context/auth.store'
import { useCardWidth } from '@/hooks/useCardWidth'
import { getVideoProgress } from '@/utils/ReactUtils'

interface EpisodeCardProps {
  episode: any
  playEpisode: (episode: any) => void
  goToDetails: (episode: any) => void
  getEpisodeMenu: (episode: any) => any
  editEpisode: (episode: any) => void
}

function EpisodeCard({
  episode,
  goToDetails,
  playEpisode,
  getEpisodeMenu,
  editEpisode,
}: EpisodeCardProps) {
  const user = useServerStore((state) => state.currentUser)
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const { cardWidth } = useCardWidth()

  const watchedList = episode.video.watchLists.find((list: any) => list.userId === user?.id)

  const timeWatched = watchedList?.timeWatched ?? 0

  return (
    <Card
      itemKey={episode.id}
      imgSrc={episode.video?.imgSrc}
      aspectRatio={16 / 9}
      width={isMobile || isTablet ? '100%' : cardWidth * 2.2}
      progress={getVideoProgress(episode.video, timeWatched)}
      title={episode.name}
      watched={watchedList && timeWatched < episode.video.runtime * 0.9}
      subtitle={`${t('episode')} ${episode.episodeNumber.toString()}`}
      action={() => goToDetails(episode)}
      playButtonAction={() => playEpisode(episode)}
      menu={getEpisodeMenu(episode)}
      editModal={
        <Button
          variant={'ghost'}
          size={'icon'}
          onClick={(e) => {
            e.stopPropagation()
            editEpisode(episode)
          }}
        >
          <Pencil size={16} />
        </Button>
      }
      errorSrc="/img/Default_video_thumbnail.jpg"
    />
  )
}

export default EpisodeCard
