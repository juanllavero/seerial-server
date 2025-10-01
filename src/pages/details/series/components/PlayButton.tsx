import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { PlayIcon } from '@/components/ui/IconLibrary'
import { Episode, Season } from '@/data/interfaces/Media'
import { authenticatedFetch } from '@/lib/auth'
import { authenticatedFetcher } from '@/utils/utils'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import useSWR from 'swr'

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
          `${serverUrl}/details/episode-video?id=${episodeId}`,
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
