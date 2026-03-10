import { Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Card from '@/components/cards/Card'
import { useIsMobile } from '@/components/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { useServerStore } from '@/context/auth.store'
import type { Episode } from '@/data/interfaces/Media'
import { getVideoProgress } from '@/utils/ReactUtils'

interface EpisodeCardDetailsProps {
  episode: any
  playEpisode: (episode: Episode) => void
  goToDetails: (episode: Episode) => void
  getEpisodeMenu: (episode: Episode) => any
  editEpisode: (episode: any) => void
}

function EpisodeCardDetails({
  episode,
  playEpisode,
  goToDetails,
  getEpisodeMenu,
  editEpisode,
}: EpisodeCardDetailsProps) {
  const user = useServerStore((state) => state.currentUser)
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  const watchedList = episode.video.watchLists.find((list: any) => list.userId === user?.id)

  const timeWatched = watchedList?.timeWatched ?? 0

  return (
    <FlexBox justify="start" align="center" gap={1} width={'100%'}>
      <div className="w-[40%] max-w-100 min-w-30">
        <Card
          itemKey={episode.id}
          imgSrc={episode.video?.imgSrc}
          aspectRatio={16 / 9}
          width={'100%'}
          progress={getVideoProgress(episode.video, timeWatched)}
          title={''}
          watched={watchedList && timeWatched < episode.video.runtime * 0.9}
          subtitle={''}
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
      </div>
      <FlexBox direction="column" width={'80%'}>
        <span className={`${isMobile ? 'text-sm' : ''} font-semibold`}>{episode.name}</span>
        <span
          className={`mb-${isMobile ? '1' : '3'} ${isMobile ? 'text-sm' : ''}`}
        >{`${t('episode')} ${episode.episodeNumber.toString()}`}</span>
        <span className={`line-clamp-${isMobile ? '2' : '4'} text-sm`}>{episode.overview}</span>
      </FlexBox>
    </FlexBox>
  )
}

export default EpisodeCardDetails
