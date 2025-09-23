import Loading from '@/components/Loading'
import FlexBox from '@/components/ui/FlexBox'
import SelectableWrapper from '@/components/ui/SelectableWrapper'
import { useServerStore } from '@/context/server.context'
import { Video } from '@/data/interfaces/Media'
import {
  VideoTrack,
  AudioTrack,
  SubtitleTrack,
} from '@/data/interfaces/MediaInfo'
import { authenticatedFetch } from '@/lib/auth'
import { useLanguageName } from '@/localization/TrackLanguages'
import { getAudioTrack, getSubtitleTrack } from '@/utils/ReactUtils'
import { authenticatedFetcher } from '@/utils/utils'
import { t } from 'i18next'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useSWR, { mutate } from 'swr'

interface VideoInfo {
  title: string
  subtitle: string
  preferAudioLan: string
  preferSubtitleLan: string
  subsMode: string
}

interface VideoTracksProps {
  video: Video | null
  mutate: () => void
}

function VideoTracks({ video, mutate }: VideoTracksProps) {
  const { i18n } = useTranslation()
  const serverUrl = useServerStore((state) => state.serverUrl)
  // Get video info
  const { data: videoInfo, isLoading } = useSWR<VideoInfo>(
    video && serverUrl !== '' ? `${serverUrl}/videoInfo?id=${video.id}` : null,
    authenticatedFetcher,
  )

  const [selectedVideoTrack, setSelectedVideoTrack] =
    useState<VideoTrack | null>(
      video?.videoTracks?.find((track: VideoTrack) => track.selected) || null,
    )
  const [selectedAudioTrack, setSelectedAudioTrack] =
    useState<AudioTrack | null>(
      video?.audioTracks?.find((track: AudioTrack) => track.selected) || null,
    )
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] =
    useState<SubtitleTrack | null>(
      video?.subtitleTracks?.find((track: SubtitleTrack) => track.selected) ||
        null,
    )
  const [tracks, setTracks] = useState<{
    videoTracks: VideoTrack[]
    audioTracks: AudioTrack[]
    subtitleTracks: SubtitleTrack[]
  }>({
    videoTracks: video?.videoTracks || [],
    audioTracks: video?.audioTracks || [],
    subtitleTracks: video?.subtitleTracks || [],
  })

  const hasFetched = useRef(false)

  useEffect(() => {
    if (!video || !videoInfo || hasFetched.current) return
    hasFetched.current = true

    const fetchData = async () => {
      const result = await authenticatedFetch(
        `${serverUrl}/updateMediaInfo`,
        'PUT',
        { videoId: video.id },
      )

      if (!result || !result.ok) {
        return
      }

      const data = await result.json()

      const { videoTracks, audioTracks, subtitleTracks } = data
      setTracks({ videoTracks, audioTracks, subtitleTracks })

      const audioTrack = getAudioTrack(videoInfo.preferAudioLan, video)
      const subtitleTrack = getSubtitleTrack(
        videoInfo.preferSubtitleLan,
        videoInfo.subsMode,
        video,
      )
      const videoTrack = videoTracks[0] ?? null

      console.log({
        audioTrack,
        subtitleTrack,
        videoTrack,
      })

      setSelectedVideoTrack(videoTrack)
      setSelectedAudioTrack(audioTrack)
      setSelectedSubtitleTrack(subtitleTrack)

      if (videoTrack && videoTracks) {
        for (const videoTrack of videoTracks) {
          videoTrack.selected = false
        }
        videoTrack.selected = true
      }

      if (audioTrack && audioTracks) {
        for (const audioTrack of audioTracks) {
          audioTrack.selected = false
        }
        audioTrack.selected = true
      }

      if (subtitleTrack && subtitleTracks) {
        for (const subTrack of subtitleTracks) {
          subTrack.selected = false
        }
        subtitleTrack.selected = true
      }

      mutate()
    }

    fetchData()
  }, [video, videoInfo])

  const handleVideoTrackChange = (key: string, value: string) => {
    setSelectedVideoTrack(
      tracks.videoTracks.find((track) => track.id === Number(value)) ?? null,
    )
  }

  const handleAudioTrackChange = (key: string, value: string) => {
    setSelectedAudioTrack(
      tracks.audioTracks.find((track) => track.id === Number(value)) ?? null,
    )
  }

  const handleSubtitleTrackChange = (key: string, value: string) => {
    setSelectedSubtitleTrack(
      tracks.subtitleTracks.find((track) => track.id === Number(value)) ?? null,
    )
  }

  if (isLoading) return <Loading />

  if (!video || !videoInfo || !tracks || tracks.audioTracks.length === 0)
    return null

  return (
    <FlexBox gap={1} padding="0 0 0 1rem">
      <FlexBox
        direction="column"
        justify="center"
        align="start"
        gap={1}
        width={'6rem'}
        height={'10rem'}
      >
        <FlexBox justify="center" align="center" height={'2rem'}>
          <span style={{ color: 'lightgray' }}>{t('video')}</span>
        </FlexBox>
        <FlexBox justify="center" align="center" height={'2rem'}>
          <span style={{ color: 'lightgray' }}>{t('audio')}</span>
        </FlexBox>
        <FlexBox justify="center" align="center" height={'2rem'}>
          <span style={{ color: 'lightgray' }}>{t('subs')}</span>
        </FlexBox>
      </FlexBox>
      <FlexBox
        direction="column"
        justify="center"
        align="start"
        gap={1}
        width={'100%'}
        height={'10rem'}
      >
        {tracks.videoTracks &&
        tracks.videoTracks.filter((track) => track.codec !== 'MJPEG')?.length >
          1 ? (
          <SelectableWrapper
            value={selectedVideoTrack?.displayTitle ?? ''}
            onValueChange={handleVideoTrackChange}
            options={
              tracks.videoTracks
                ? tracks.videoTracks
                    .filter((track) => track.codec !== 'MJPEG')
                    .map((track: VideoTrack) => ({
                      key: track.id.toString(),
                      value: track.displayTitle,
                    }))
                : []
            }
          />
        ) : (
          <span className="font-semibold">
            {selectedVideoTrack?.displayTitle ?? t('none')}
          </span>
        )}

        {tracks.audioTracks && tracks.audioTracks.length > 1 ? (
          <SelectableWrapper
            value={
              selectedAudioTrack
                ? `${useLanguageName(selectedAudioTrack?.languageTag ?? '', i18n.language)} ${selectedAudioTrack?.displayTitle}`
                : ''
            }
            onValueChange={handleAudioTrackChange}
            options={
              tracks.audioTracks
                ? tracks.audioTracks.map((track: AudioTrack) => ({
                    key: track.id.toString(),
                    value: `${useLanguageName(track.languageTag, i18n.language)} ${track.displayTitle}`,
                  }))
                : []
            }
          />
        ) : (
          <span className="font-semibold">
            {selectedAudioTrack
              ? `${useLanguageName(selectedAudioTrack?.languageTag ?? '', i18n.language)} ${selectedAudioTrack?.displayTitle}`
              : ''}
          </span>
        )}

        {tracks.subtitleTracks && tracks.subtitleTracks.length > 1 ? (
          <SelectableWrapper
            value={
              selectedSubtitleTrack
                ? `${selectedSubtitleTrack.title} ${selectedSubtitleTrack.displayTitle}`
                : t('none')
            }
            onValueChange={handleSubtitleTrackChange}
            options={
              tracks.subtitleTracks
                ? [
                    {
                      key: 'none',
                      value: t('none'),
                    },
                    ...tracks.subtitleTracks
                      .filter(
                        (track) =>
                          track.codec !== 'HDMV_PGS_SUBTITLE' &&
                          track.codec !== 'DVD_SUBTITLE',
                      )
                      .map((track: SubtitleTrack) => ({
                        key: track.id.toString(),
                        value: `${track.title} ${track.displayTitle}`,
                      })),
                  ]
                : []
            }
          />
        ) : (
          <span className="font-semibold">
            {`${selectedSubtitleTrack?.title} ${selectedSubtitleTrack?.displayTitle}`}
          </span>
        )}
      </FlexBox>
    </FlexBox>
  )
}

export default VideoTracks
