import Card from '@/components/cards/Card'
import EpisodeDialog from '@/components/dialogs/episode/EpisodeDialog'
import { useIsMobile } from '@/components/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { useAuth } from '@/context/auth.context'
import { useDialogStore } from '@/context/dialog.context'
import { Episode } from '@/data/interfaces/Media'
import { getVideoProgress } from '@/utils/ReactUtils'
import { Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface EpisodeCardDetailsProps {
  episode: any
  playEpisode: (episode: Episode) => void
  goToDetails: (episode: Episode) => void
  getEpisodeMenu: (episode: Episode) => any
}

function EpisodeCardDetails({
  episode,
  playEpisode,
  goToDetails,
  getEpisodeMenu,
}: EpisodeCardDetailsProps) {
  const { user } = useAuth()
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const openEpisodeDialog = useDialogStore((state) => state.openEpisodeDialog)

  const watchedList = episode.video.watchLists.find(
    (list: any) => list.userId === user?.id,
  )

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
                openEpisodeDialog(episode)
              }}
            >
              <Pencil size={16} />
            </Button>
          }
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
