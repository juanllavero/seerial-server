import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { Episode, Season } from '@/data/interfaces/Media'
import { authenticatedFetcher } from '@/utils/utils'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import { PlayIcon } from '@/components/ui/IconLibrary'
import { useServerStore } from '@/context/server.context'
import { authenticatedFetch } from '@/lib/auth'

interface PlayButtonProps {
  currentlyWatchingEpisodeId?: string
  selectedSeasonId: string | null
  serverUrl: string
}

function PlayButton({
  currentlyWatchingEpisodeId,
  selectedSeasonId,
  serverUrl,
}: PlayButtonProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { data: season } = useSWR<Season>(
    selectedSeasonId
      ? `${serverUrl}/details/season?id=${selectedSeasonId}`
      : null,
    authenticatedFetcher,
  )

  // Get current episode
  const { data: episode } = useSWR<Episode>(
    currentlyWatchingEpisodeId
      ? `${serverUrl}/details/episode?id=${currentlyWatchingEpisodeId}`
      : null,
    authenticatedFetcher,
  )

  const getPlayButtonText = () => {
    return !episode
      ? t('playButton')
      : `${t('continueWatching')} — ${t('seasonLetter')}${episode.seasonNumber}${t('episodeLetter')}${episode.episodeNumber}`
  }

  return (
    <Button
      onClick={async () => {
        const episodeId = episode ? episode.id : season?.episodes[0].id

        const response = await authenticatedFetch(
          `${serverUrl}/episode-video?episodeId=${episodeId}`,
        )

        if (!response.ok) {
          return
        }

        const data = await response.json()
        navigate(`/video-player/${data.id}`)
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
