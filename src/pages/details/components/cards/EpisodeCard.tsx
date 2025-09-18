import Card from '@/components/cards/Card'
import { useIsMobile } from '@/components/hooks/use-mobile'
import { useIsTablet } from '@/components/hooks/use-tablet'
import { Button } from '@/components/ui/button'
import { useDialogStore } from '@/context/dialog.context'
import { useCardWidth } from '@/hooks/useCardWidth'
import { getVideoProgress } from '@/utils/ReactUtils'
import { Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface EpisodeCardProps {
  episode: any
  playEpisode: (episode: any) => void
  goToDetails: (episode: any) => void
  getEpisodeMenu: (episode: any) => any
}

function EpisodeCard({
  episode,
  goToDetails,
  playEpisode,
  getEpisodeMenu,
}: EpisodeCardProps) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const { cardWidth } = useCardWidth()
  const openEpisodeDialog = useDialogStore((state) => state.openEpisodeDialog)

  return (
    <Card
      itemKey={episode.id}
      imgSrc={episode.video?.imgSrc}
      aspectRatio={16 / 9}
      width={isMobile || isTablet ? '100%' : cardWidth * 2.2}
      progress={getVideoProgress(episode.video)}
      title={episode.name}
      watched={episode.video.watchStatus}
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
            openEpisodeDialog(episode)
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
