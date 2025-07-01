import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { Episode } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import { PlayIcon } from '@/components/ui/IconLibrary'

interface PlayButtonProps {
  currentlyWatchingEpisodeId?: string
  serverIP: string
}

function PlayButton({ currentlyWatchingEpisodeId, serverIP }: PlayButtonProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  // Get current episode
  const { data: episode } = useSWR<Episode>(
    currentlyWatchingEpisodeId
      ? `https://${serverIP}/details/episode?id=${currentlyWatchingEpisodeId}`
      : null,
    fetcher,
  )

  const getPlayButtonText = () => {
    return !episode
      ? t('playButton')
      : `${t('continueWatching')} — ${t('seasonLetter')}${episode.seasonNumber + 1}${t('episodeLetter')}${episode.episodeNumber + 1}`
  }

  return (
    <Button
      onClick={async () => {
        if (episode) {
          const response = await fetch(
            `https://${serverIP}/video?id=${episode.id}`,
          )

          if (!response.ok) {
            return
          }

          const data = await response.json()
          navigate(`/server/${serverIP}/video-player/${data.videoId}`)
        }
      }}
    >
      <FlexBox align="center" gap={0.5} className="text-black">
        <PlayIcon color="#111111" />
        {getPlayButtonText()}
      </FlexBox>
    </Button>
  )
}

export default PlayButton
