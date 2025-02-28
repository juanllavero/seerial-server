import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AudioTrack, SubtitleTrack } from '@/data/interfaces/MediaInfo'
import React from 'react'
import { useServerStore } from '@/context/server.context'
import { url } from 'inspector'
import useDataStore from '@/context/data.context'

function VideoPlayerPage() {
  const { selectedEpisode: episode } = useDataStore()
  const { serverIP } = useServerStore()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  if (!episode) {
    return null
  }

  const [selectedAudio, setSelectedAudio] = useState<AudioTrack | null>(
    episode.audioTracks?.find((track) => track.selected) || null,
  )
  const [selectedSubtitle, setSelectedSubtitle] =
    useState<SubtitleTrack | null>(
      episode.subtitleTracks?.find((track) => track.selected) || null,
    )

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.load() // Recarga el video al cambiar de pista de audio
    }
  }, [selectedAudio])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <video
        ref={videoRef}
        className="w-full max-w-4xl"
        src={`https://${serverIP}/video?path=${episode.videoSrc}`}
        autoPlay
        crossOrigin="anonymous"
        playsInline
      />
      <div className="flex gap-4">
        <Button onClick={togglePlay}>{isPlaying ? 'Pause' : 'Play'}</Button>
        <Select
          onValueChange={(id) =>
            setSelectedAudio(
              episode.audioTracks.find((track) => track.id === Number(id)) ||
                null,
            )
          }
          defaultValue={selectedAudio?.id.toString()}
        >
          <SelectTrigger>
            <SelectValue placeholder="Audio Track" />
          </SelectTrigger>
          <SelectContent>
            {episode.audioTracks?.map((track) => (
              <SelectItem key={track.id} value={track.id.toString()}>
                {track.displayTitle} ({track.languageTag})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          onValueChange={(id) =>
            setSelectedSubtitle(
              episode.subtitleTracks.find((track) => track.id === Number(id)) ||
                null,
            )
          }
          defaultValue={selectedSubtitle?.id.toString()}
        >
          <SelectTrigger>
            <SelectValue placeholder="Subtitles" />
          </SelectTrigger>
          <SelectContent>
            {episode.subtitleTracks?.map((track) => (
              <SelectItem key={track.id} value={track.id.toString()}>
                {track.displayTitle} ({track.languageTag})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default VideoPlayerPage
