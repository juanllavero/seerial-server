import Card from '@/components/cards/Card'
import React from 'react'
import { useTranslation } from 'react-i18next'

interface EpisodeCardProps {
  episode: any
  handleSelectEpisode: (episode: any) => void
  getEpisodeMenu: (episode: any) => any
}

function EpisodeCard({
  episode,
  handleSelectEpisode,
  getEpisodeMenu,
}: EpisodeCardProps) {
  const { t } = useTranslation()

  return (
    <Card
      itemKey={episode.id}
      imgSrc={episode.imgSrc}
      aspectRatio={16 / 9}
      width={400}
      progress={
        (episode.timeWatched / episode.runtimeInSeconds) * 100 > 0
          ? (episode.timeWatched / episode.runtimeInSeconds) * 100
          : undefined
      }
      title={episode.name}
      subtitle={`${t('episode')} ${episode.episodeNumber.toString()}`}
      action={() => handleSelectEpisode(episode)}
      menu={getEpisodeMenu(episode)}
      errorSrc="/img/Default_video_thumbnail.jpg"
    />
  )
}

export default EpisodeCard
