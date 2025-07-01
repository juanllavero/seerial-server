import Card from '@/components/cards/Card'
import EpisodeDialog from '@/components/dialogs/episode/EpisodeDialog'
import { useIsMobile } from '@/components/hooks/use-mobile'
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
  const isMobile = useIsMobile()

  return (
    <FlexBox justify="start" align="center" gap={1} width={'100%'}>
      <div className="w-[40%] max-w-100 min-w-30">
        <Card
          itemKey={episode.id}
          imgSrc={episode.video?.imgSrc}
          aspectRatio={16 / 9}
          width={'100%'}
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
          editModal={<EpisodeDialog />}
          errorSrc="/img/Default_video_thumbnail.jpg"
        />
      </div>
      <FlexBox direction="column" width={'80%'}>
        <span className={`${isMobile ? 'text-sm' : ''} font-semibold`}>
          {episode.name}
        </span>
        <span
          className={`mb-${isMobile ? '1' : '3'} ${isMobile ? 'text-sm' : ''}`}
        >{`${t('episode')} ${episode.episodeNumber.toString()}`}</span>
        <span className={`line-clamp-${isMobile ? '2' : '4'} text-sm`}>
          {episode.overview}
        </span>
      </FlexBox>
    </FlexBox>
  )
}

export default EpisodeCardDetails
