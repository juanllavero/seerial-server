import Loading from '@/components/Loading'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import LazyImage from '@/components/ui/LazyImage'
import { useServerStore } from '@/context/server.context'
import { useWebSocketStore } from '@/context/ws.context'
import { MessageType } from '@/data/enums/WSMessage'
import { authenticatedFetch } from '@/lib/auth'
import { formatDate } from '@/utils/ReactUtils'
import { authenticatedFetcher } from '@/utils/utils'
import { PlayIcon } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import useSWR from 'swr'
import VideoTracks from './components/VideoTracks'

function EpisodeDetailsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const wsMessage = useWebSocketStore((state) => state.wsMessage)
  const serverUrl = useServerStore((state) => state.serverUrl)
  const { serverId, episodeId } = useParams()

  const {
    data: episode,
    isLoading,
    mutate,
  } = useSWR(
    episodeId && serverUrl !== ''
      ? `${serverUrl}/details/episode?id=${episodeId}`
      : null,
    authenticatedFetcher,
  )

  const { data: season } = useSWR(
    episode && serverUrl !== ''
      ? `${serverUrl}/details/season?id=${episode.seasonId}`
      : null,
    authenticatedFetcher,
  )

  const { data: series } = useSWR(
    season && serverUrl !== ''
      ? `${serverUrl}/details/series?id=${season.seriesId}`
      : null,
    authenticatedFetcher,
  )

  // Mutate content on ws message
  useEffect(() => {
    if (wsMessage === MessageType.MUTATE_SEASON) {
      mutate()
    }
  }, [wsMessage, mutate])

  if (isLoading) {
    return <Loading />
  }

  return (
    <FlexBox
      className="details-container"
      gap={2}
      wrap="nowrap"
      padding="3rem"
      height={'100%'}
    >
      <FlexBox direction="column" gap={1}>
        <LazyImage
          url={episode.video.imgSrc}
          width={500}
          maxHeight={300}
          height={300}
          errorSrc={'/img/Default_video_thumbnail.jpg'}
        />

        <VideoTracks video={episode?.video} mutate={mutate} />
      </FlexBox>

      <FlexBox direction="column" gap={1}>
        <FlexBox direction="column">
          <span
            onClick={() =>
              navigate(`/server/${serverId}/details/series/${series?.id}`)
            }
            className="a_text cursor-pointer text-4xl font-black uppercase"
          >
            {series ? series.name : 'None'}
          </span>
          <span className="text-2xl font-semibold">{episode.name}</span>
        </FlexBox>
        <FlexBox gap={1}>
          <span>
            {t('seasonLetter')}
            {episode.seasonNumber}
            {' · '}
            {t('episodeLetter')}
            {episode.episodeNumber}
          </span>
          <span>{formatDate(episode.year)}</span>
          <span>{episode.video.runtime.toFixed()}min</span>
        </FlexBox>
        <span className="w-[80%] max-w-300">{episode.overview}</span>

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
            {t('playButton')}
          </FlexBox>
        </Button>
      </FlexBox>
    </FlexBox>
  )
}

export default EpisodeDetailsPage
