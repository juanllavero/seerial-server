import { useIsTablet } from '@/components/hooks/use-tablet'
import Loading from '@/components/Loading'
import FlexBox from '@/components/ui/FlexBox'
import { useServerStore } from '@/context/server.context'
import { Episode, Video } from '@/data/interfaces/Media'
import {
  AudioTrack,
  SubtitleTrack,
  VideoTrack,
} from '@/data/interfaces/MediaInfo'
import { getAudioTrack, getSubtitleTrack } from '@/utils/ReactUtils'
import { fetcher } from '@/utils/utils'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

interface EpisodeMediaInfoTabProps {
  video: Video
  setEpisode: (episode: Episode) => void
}

interface VideoInfo {
  title: string
  subtitle: string
  preferAudioLan: string
  preferSubtitleLan: string
  subsMode: string
}

function EpisodeMediaInfoTab({ video, setEpisode }: EpisodeMediaInfoTabProps) {
  const serverIP = useServerStore((state) => state.serverIP)
  const isTablet = useIsTablet()
  const [loaded, setLoaded] = useState(false)

  // Get video info
  const { data: videoInfo } = useSWR<VideoInfo>(
    video.id && serverIP !== ''
      ? `http://${serverIP}/videoInfo?id=${video.id}`
      : null,
    fetcher,
  )

  useEffect(() => {
    const fetchData = async () => {
      if (!videoInfo) return

      setLoaded(false)

      const attemptFetch = async () => {
        if (serverIP === '') return

        const result = await fetch(`http://${serverIP}/updateMediaInfo`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoId: video.id,
          }),
        })

        return result.ok ? await result.json() : null
      }

      // First attempt
      let data = await attemptFetch()

      // If there are no data after the first attempt, wait 2 seconds and make second attempt
      if (!data) {
        await new Promise((resolve) => setTimeout(resolve, 2000)) // Wait 2 seconds
        data = await attemptFetch()

        // If the second attempt fails, wait 4 seconds and set loaded as true
        if (!data) {
          await new Promise((resolve) => setTimeout(resolve, 2000)) // Wait 4 seconds
          setLoaded(true)
          return
        }
      }

      // Process the data if it was obtained in either of the attempts
      const audioTrack = getAudioTrack(videoInfo.preferAudioLan, video)
      const subtitleTrack = getSubtitleTrack(
        videoInfo.preferSubtitleLan,
        videoInfo.subsMode,
        video,
      )
      const videoTrack = data.videoTracks[0] ?? null

      if (videoTrack && video.videoTracks) {
        for (const videoTrack of video.videoTracks) {
          videoTrack.selected = false
        }
        videoTrack.selected = true
      }

      if (audioTrack && video.audioTracks) {
        for (const audioTrack of video.audioTracks) {
          audioTrack.selected = false
        }
        audioTrack.selected = true
      }

      if (subtitleTrack && video.subtitleTracks) {
        for (const subTrack of video.subtitleTracks) {
          subTrack.selected = false
        }
        subtitleTrack.selected = true
      }

      setEpisode({
        ...data,
        videoTracks: data.videoTracks
          ? data.videoTracks.map((track: VideoTrack) =>
              track.id === (videoTrack?.id ?? '')
                ? (videoTrack ?? track)
                : track,
            )
          : [],
        audioTracks: data.audioTracks
          ? data.audioTracks.map((track: AudioTrack) =>
              track.id === (audioTrack?.id ?? '')
                ? (audioTrack ?? track)
                : track,
            )
          : [],
        subtitleTracks: data.subtitleTracks
          ? data.subtitleTracks.map((track: SubtitleTrack) =>
              track.id === (subtitleTrack?.id ?? '')
                ? (subtitleTrack ?? track)
                : track,
            )
          : [],
      })

      setLoaded(true)
    }

    fetchData()
  }, [])

  const getVideoInfo = (track: VideoTrack) => {
    const mediaInfoFieldsVideo = [
      { key: 'Codec', value: track.codec },
      { key: 'Codec Extended', value: track.codecExt },
      { key: 'Bitrate', value: track.bitrate },
      { key: 'Frame Rate', value: track.framerate },
      { key: 'Coded Height', value: track.codedHeight },
      { key: 'Coded Width', value: track.codedWidth },
      { key: 'Chroma Location', value: track.chromaLocation },
      { key: 'Color Space', value: track.colorSpace },
      { key: 'Aspect Ratio', value: track.aspectRatio },
      { key: 'Profile', value: track.profile },
      { key: 'Ref Frames', value: track.refFrames },
      { key: 'Color Range', value: track.colorRange },
      { key: 'Display Title', value: track.displayTitle },
    ]

    return (
      <>
        {mediaInfoFieldsVideo.map(
          (field, index) =>
            field.value && (
              <div key={index + 'video-media'}>
                <span className="mr-2" style={{ color: 'lightgray' }}>
                  {field.key}
                </span>
                <span className="font-semibold">{field.value}</span>
              </div>
            ),
        )}
      </>
    )
  }

  const getAudioInfo = (track: AudioTrack) => {
    const mediaInfoFieldsAudio = [
      { key: 'Codec', value: track.codec },
      { key: 'Codec Extended', value: track.codecExt },
      { key: 'Channels', value: track.channels },
      { key: 'Channel Layout', value: track.channelLayout },
      { key: 'Bitrate', value: track.bitrate },
      { key: 'Language', value: track.language },
      { key: 'Language tag', value: track.languageTag },
      { key: 'Bit Depth', value: track.bitDepth },
      { key: 'Profile', value: track.profile },
      { key: 'Sampling Rate', value: track.samplingRate },
      { key: 'Display Title', value: track.displayTitle },
    ]

    return (
      <>
        {mediaInfoFieldsAudio.map(
          (field, index) =>
            field.value && (
              <div key={index + 'audio-media'}>
                <span className="mr-2" style={{ color: 'lightgray' }}>
                  {field.key}
                </span>
                <span className="font-semibold">{field.value}</span>
              </div>
            ),
        )}
      </>
    )
  }

  const getSubtitleInfo = (track: SubtitleTrack) => {
    const mediaInfoFieldsSubs = [
      { key: 'Codec', value: track.codec },
      { key: 'Codec Extended', value: track.codecExt },
      { key: 'Language', value: track.language },
      { key: 'Language tag', value: track.languageTag },
      { key: 'Title', value: track.title },
      { key: 'Display Title', value: track.displayTitle },
    ]

    return (
      <>
        {mediaInfoFieldsSubs.map(
          (field, index) =>
            field.value && (
              <div key={index + 'subs-media'}>
                <span className="mr-2" style={{ color: 'lightgray' }}>
                  {field.key}
                </span>
                <span className="font-semibold">{field.value}</span>
              </div>
            ),
        )}
      </>
    )
  }

  if (!loaded || !video) {
    return (
      <FlexBox
        direction="column"
        gap={1}
        justify="space-between"
        height={isTablet ? '25rem' : '35rem'}
        hideScrollbar={isTablet}
        scroll="vertical"
      >
        <Loading />
      </FlexBox>
    )
  }

  return (
    <FlexBox
      direction="column"
      gap={1}
      justify="space-between"
      height={isTablet ? '25rem' : '35rem'}
      width={isTablet ? '100%' : '50rem'}
      padding="0 0.5rem"
      hideScrollbar={isTablet}
      scroll="vertical"
    >
      <FlexBox direction="column" className="left-media-info">
        <span className="mb-1 text-lg font-semibold">Media info</span>
        <FlexBox gap={0.5}>
          <span style={{ color: 'lightgray' }}>Duration</span>
          <span className="font-semibold">{video.mediaInfo?.duration}</span>
        </FlexBox>
        <FlexBox gap={0.5}>
          <span style={{ color: 'lightgray' }}>File</span>
          <span className="font-semibold">{video.mediaInfo?.file}</span>
        </FlexBox>
        <FlexBox gap={0.5}>
          <span style={{ color: 'lightgray' }}>Location</span>
          <span className="font-semibold">{video.mediaInfo?.location}</span>
        </FlexBox>
        <FlexBox gap={0.5}>
          <span style={{ color: 'lightgray' }}>Bitrate</span>
          <span className="font-semibold">{video.mediaInfo?.bitrate}</span>
        </FlexBox>
        <FlexBox gap={0.5}>
          <span style={{ color: 'lightgray' }}>Size</span>
          <span className="font-semibold">{video.mediaInfo?.size}</span>
        </FlexBox>
        <FlexBox gap={0.5}>
          <span style={{ color: 'lightgray' }}>Container</span>
          <span className="font-semibold">{video.mediaInfo?.container}</span>
        </FlexBox>
      </FlexBox>
      <FlexBox direction="column" gap={1}>
        {video.videoTracks &&
          video.videoTracks.map((track: VideoTrack) => (
            <div key={track.id + '-video'}>
              <span className="mt-2 mb-1 text-lg font-semibold">Video</span>
              {getVideoInfo(track)}
            </div>
          ))}
        {video.audioTracks &&
          video.audioTracks.map((audioTrack: AudioTrack, index: number) => (
            <div key={index + '-audio'}>
              <span className="mt-2 mb-1 text-lg font-semibold">Audio</span>
              {getAudioInfo(audioTrack)}
            </div>
          ))}
        {video.subtitleTracks &&
          video.subtitleTracks.map((track: SubtitleTrack, index: number) => (
            <div key={index + '-subs'}>
              <span className="mt-2 mb-1 text-lg font-semibold">Subtitle</span>
              {getSubtitleInfo(track)}
            </div>
          ))}
      </FlexBox>
    </FlexBox>
  )
}

export default EpisodeMediaInfoTab
