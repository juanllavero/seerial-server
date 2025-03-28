import Card from '@/components/cards/Card'
import FlexBox from '@/components/ui/FlexBox'
import React from 'react'
import { useTranslation } from 'react-i18next'

interface EpisodeCardDetailsProps {
  episode: any
  playEpisode: (episode: any) => void
  goToDetails: (episode: any) => void
}

function EpisodeCardDetails({
  episode,
  playEpisode,
  goToDetails,
}: EpisodeCardDetailsProps) {
  const { t } = useTranslation()

  return (
    <FlexBox justify="space-between" align="center" gap={2}>
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
        title=""
        subtitle=""
        action={() => goToDetails(episode)}
        playButtonAction={() => playEpisode(episode)}
        hideButtons
        errorSrc="/img/Default_video_thumbnail.jpg"
      />
      <FlexBox direction="column">
        <span>{episode.name}</span>
        <span className="mb-3">{`${t('episode')} ${episode.episodeNumber.toString()}`}</span>
        <span>{episode.overview}</span>
      </FlexBox>
    </FlexBox>
  )
}

export default EpisodeCardDetails
