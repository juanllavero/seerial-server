import Card from '@/components/cards/Card'
import { useIsMobile } from '@/components/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { useDialogStore } from '@/context/dialog.context'
import { Pencil } from 'lucide-react'
import React from 'react'
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
  const { openEpisodeDialog } = useDialogStore()

  return (
    <Card
      itemKey={episode.id}
      imgSrc={episode.imgSrc}
      aspectRatio={16 / 9}
      width={isMobile ? '100%' : 400}
      progress={
        (episode.timeWatched / episode.runtimeInSeconds) * 100 > 0
          ? (episode.timeWatched / episode.runtimeInSeconds) * 100
          : undefined
      }
      title={episode.name}
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
