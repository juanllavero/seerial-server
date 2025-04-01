import { useIsTablet } from '@/components/hooks/use-tablet'
import Loading from '@/components/Loading'
import FlexBox from '@/components/ui/FlexBox'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { Episode } from '@/data/interfaces/Media'
import {
  AudioTrack,
  SubtitleTrack,
  VideoTrack,
} from '@/data/interfaces/MediaInfo'
import { getAudioTrack, getSubtitleTrack } from '@/utils/ReactUtils'
import React, { useEffect, useState } from 'react'

interface EpisodeMediaInfoTabProps {
  episode: Episode
  close: () => void
  handleAccept: () => void
}

function EpisodeMediaInfoTab({
  episode,
  close,
  handleAccept,
}: EpisodeMediaInfoTabProps) {
  const {
    selectedLibrary,
    selectedSeries,
    selectedSeason,
    selectedEpisode,
    updateEpisode,
  } = useDataStore()
  const { serverIP } = useServerStore()
  const isTablet = useIsTablet()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!selectedLibrary || !selectedSeries || !selectedSeason) return

    const fetchData = async () => {
      setLoaded(false)
      const result = await fetch(`https://${serverIP}/updateMediaInfo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          episode: episode,
        }),
      })

      if (!result.ok) {
        return
      }

      const data = await result.json()

      updateEpisode({
        libraryId: selectedLibrary.id,
        showId: selectedSeries.id,
        episode: data,
      })

      const audioTrack = getAudioTrack(
        selectedLibrary,
        selectedSeason,
        data.audioTracks,
      )
      const subtitleTrack = getSubtitleTrack(
        selectedLibrary,
        selectedSeason,
        data.subtitleTracks,
      )
      const videoTrack = data.videoTracks[0] ?? null

      if (videoTrack) {
        for (const videoTrack of episode.videoTracks) {
          videoTrack.selected = false
        }
        videoTrack.selected = true
      }

      if (audioTrack) {
        for (const audioTrack of episode.audioTracks) {
          audioTrack.selected = false
        }
        audioTrack.selected = true
      }

      if (subtitleTrack) {
        for (const subTrack of episode.subtitleTracks) {
          subTrack.selected = false
        }
        subtitleTrack.selected = true
      }

      updateEpisode({
        libraryId: selectedLibrary.id,
        showId: selectedSeries.id,
        episode: {
          ...episode,
          videoTracks: episode.videoTracks.map((track) =>
            track.id === (videoTrack?.id ?? '') ? (videoTrack ?? track) : track,
          ),
          audioTracks: episode.audioTracks.map((track) =>
            track.id === (audioTrack?.id ?? '') ? (audioTrack ?? track) : track,
          ),
          subtitleTracks: episode.subtitleTracks.map((track) =>
            track.id === (subtitleTrack?.id ?? '')
              ? (subtitleTrack ?? track)
              : track,
          ),
        },
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

  if (!loaded)
    return (
      <FlexBox
        direction="column"
        gap={1}
        justify="space-between"
        height={isTablet ? '25rem' : '35rem'}
        width={isTablet ? '100%' : '50rem'}
        hideScrollbar={isTablet}
        scroll="vertical"
      >
        <Loading />
      </FlexBox>
    )

  return (
    <FlexBox
      direction="column"
      gap={1}
      justify="space-between"
      height={isTablet ? '25rem' : '35rem'}
      width={isTablet ? '100%' : '50rem'}
      hideScrollbar={isTablet}
      scroll="vertical"
    >
      <FlexBox direction="column" className="left-media-info">
        <span className="mb-1 text-lg font-semibold">Media info</span>
        <FlexBox gap={0.5}>
          <span style={{ color: 'lightgray' }}>Duration</span>
          <span className="font-semibold">
            {selectedEpisode?.mediaInfo?.duration}
          </span>
        </FlexBox>
        <FlexBox gap={0.5}>
          <span style={{ color: 'lightgray' }}>File</span>
          <span className="font-semibold">
            {selectedEpisode?.mediaInfo?.file}
          </span>
        </FlexBox>
        <FlexBox gap={0.5}>
          <span style={{ color: 'lightgray' }}>Location</span>
          <span className="font-semibold">
            {selectedEpisode?.mediaInfo?.location}
          </span>
        </FlexBox>
        <FlexBox gap={0.5}>
          <span style={{ color: 'lightgray' }}>Bitrate</span>
          <span className="font-semibold">
            {selectedEpisode?.mediaInfo?.bitrate}
          </span>
        </FlexBox>
        <FlexBox gap={0.5}>
          <span style={{ color: 'lightgray' }}>Size</span>
          <span className="font-semibold">
            {selectedEpisode?.mediaInfo?.size}
          </span>
        </FlexBox>
        <FlexBox gap={0.5}>
          <span style={{ color: 'lightgray' }}>Container</span>
          <span className="font-semibold">
            {selectedEpisode?.mediaInfo?.container}
          </span>
        </FlexBox>
      </FlexBox>
      <FlexBox direction="column" gap={1}>
        {selectedEpisode?.videoTracks.map((track: VideoTrack) => (
          <div key={track.id + '-video'}>
            <span className="mt-2 mb-1 text-lg font-semibold">Video</span>
            {getVideoInfo(track)}
          </div>
        ))}
        {selectedEpisode?.audioTracks.map(
          (audioTrack: AudioTrack, index: number) => (
            <div key={index + '-audio'}>
              <span className="mt-2 mb-1 text-lg font-semibold">Audio</span>
              {getAudioInfo(audioTrack)}
            </div>
          ),
        )}
        {selectedEpisode?.subtitleTracks.map(
          (track: SubtitleTrack, index: number) => (
            <div key={index + '-subs'}>
              <span className="mt-2 mb-1 text-lg font-semibold">Subtitle</span>
              {getSubtitleInfo(track)}
            </div>
          ),
        )}
      </FlexBox>
    </FlexBox>
  )
}

export default EpisodeMediaInfoTab
