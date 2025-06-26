import useMusicStore from '@/context/music.context'
import { useServerStore } from '@/context/server.context'
import { RepeateMode } from '@/data/enums/Music'
import { Album } from '@/data/interfaces/Music'
import GradientBackground from '@/layouts/backgrounds/GradientBackground'
import { ReactUtils } from '@/utils/ReactUtils'
import { fetcher } from '@/utils/utils'
import { t } from 'i18next'
import { X } from 'lucide-react'
import { memo, useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { useIsMobile } from '../hooks/use-mobile'
import { useIsTablet } from '../hooks/use-tablet'
import { Button } from '../ui/button'
import DesktopCompactControls from './controls/DesktopCompactControls'
import MusicControlsExpanded from './controls/MusicControlsExpanded'
import MusicPlayerCover from './cover/Cover'
import MusicPlayerHeader from './header/Header'
import Menu from './menu/Menu'

function MusicPlayer() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const {
    progress,
    setProgress,
    setVolume,
    isExpanded,
    buffered,
    setBuffered,
    duration,
    setDuration,
    setIsExpanded,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    volume,
    setPrevVolume,
    repeateMode,
    setRepeateMode,
  } = useMusicStore()
  const audioRef = useRef<HTMLAudioElement>(null) // Reference to the audio element
  const timelineRef = useRef<HTMLDivElement>(null)
  const [previewTime, setPreviewTime] = useState(0)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isCoverHovered, setIsCoverHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(16)

  const { selectedServer } = useServerStore()
  const { currentSong, songQueue, selectSong } = useMusicStore()

  // Get Album details
  const { data: album } = useSWR<Album>(
    currentSong && currentSong.albumId && selectedServer
      ? `https://${selectedServer.ip}/details/album?id=${currentSong.albumId}`
      : null,
    fetcher,
  )

  // Controlar reproducción/pausa con spacebar
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault()
        togglePlayPause()
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isPlaying])

  // Sync audio element with isPlaying state
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current
          .play()
          .catch((e) => console.error('Playback error:', e))
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, currentSong])

  // Update progress based on audio timeupdate
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateBuffer = () => {
      if (audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1)
        const total = audio.duration || 0
        if (total > 0) {
          setBuffered((bufferedEnd / total) * 100)
        }
      }
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleCanPlay = () => {
      updateBuffer()
    }

    const updateProgress = () => {
      const progressPercent = (audio.currentTime / audio.duration) * 100
      setProgress(progressPercent)
      setCurrentTime((progressPercent / 100) * duration)
    }

    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('progress', updateBuffer)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('canplay', handleCanPlay)

    return () => {
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('progress', updateBuffer)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('canplay', handleCanPlay)
    }
  }, [setProgress])

  // Handle song end (for repeat and queue)
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = () => {
      if (repeateMode === RepeateMode.REPEAT_ONE) {
        audio.currentTime = 0
        audio.play()
      } else if (
        repeateMode === RepeateMode.REPEAT_ALL &&
        songQueue.length > 1
      ) {
        handleNext()
      } else {
        setIsPlaying(false)
        selectSong(null)
      }
    }

    audio.addEventListener('ended', handleEnded)
    return () => audio.removeEventListener('ended', handleEnded)
  }, [repeateMode, songQueue, selectSong, setIsPlaying])

  // Update audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleChangeRepeatState = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRepeateMode(
      repeateMode === RepeateMode.NONE
        ? RepeateMode.REPEAT_ALL
        : repeateMode === RepeateMode.REPEAT_ALL
          ? RepeateMode.REPEAT_ONE
          : RepeateMode.NONE,
    )
  }

  const handlePrevious = () => {
    const currentIndex = songQueue.findIndex(
      (song) => song.id === currentSong?.id,
    )
    if (currentIndex > 0) {
      selectSong(songQueue[currentIndex - 1])
    } else if (repeateMode === RepeateMode.REPEAT_ALL) {
      selectSong(songQueue[songQueue.length - 1])
    }
    setIsPlaying(true)
  }

  const handleNext = () => {
    const currentIndex = songQueue.findIndex(
      (song) => song.id === currentSong?.id,
    )
    if (currentIndex < songQueue.length - 1) {
      selectSong(songQueue[currentIndex + 1])
    } else if (repeateMode === RepeateMode.REPEAT_ALL) {
      selectSong(songQueue[0])
    } else {
      setIsPlaying(false)
      selectSong(null)
    }
    setIsPlaying(true)
  }

  const handleSongSelect = (index: number) => {
    selectSong(songQueue[index])
    setIsPlaying(true)
  }

  const handleExpand = () => {
    setIsExpanded(true)
  }

  const handleMinimize = () => {
    setIsExpanded(false)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isExpanded) return
    setIsDragging(true)
    setStartY(e.clientY - currentY)
    e.preventDefault()
  }

  useEffect(() => {
    if (album && selectedServer) {
      ReactUtils.generateGradient(album.coverSrc, selectedServer.ip, true)
    }
  }, [album, selectedServer])

  useEffect(() => {
    const handleMouseMoveWrapper = (e: MouseEvent) => {
      if (!isDragging || isExpanded) return

      const newY = e.clientY - startY
      const maxY = window.innerHeight - 200
      const minY = 16
      const clampedY = Math.max(minY, Math.min(maxY, newY))
      setCurrentY(clampedY)
    }

    const handleMouseUpWrapper = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMoveWrapper)
      document.addEventListener('mouseup', handleMouseUpWrapper)
      document.body.style.userSelect = 'none'
      return () => {
        document.removeEventListener('mousemove', handleMouseMoveWrapper)
        document.removeEventListener('mouseup', handleMouseUpWrapper)
        document.body.style.userSelect = ''
      }
    }
  }, [isDragging, startY, isExpanded])

  if (!album || !currentSong) return null

  const currentTime = Math.floor((progress / 100) * currentSong.duration)
  const cover = album.coverSrc

  return (
    <div
      className={`fixed z-40 ${isDragging ? 'cursor-grabbing transition-none' : `transition-all duration-500 ease-in-out ${isExpanded ? 'cursor-default' : 'cursor-grab'}`} ${
        isExpanded
          ? 'inset-0 flex h-[100%] cursor-default flex-col bg-gray-700'
          : 'right-4 w-80 rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-sm transition-none'
      }`}
      style={{
        top: isExpanded ? 0 : `${currentY}px`,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => !isExpanded && setIsHovered(false)}
    >
      {!isExpanded && (
        <div
          className={`transition-all duration-150 ease-in-out ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        >
          <Button
            className="absolute top-[-0.3rem] right-[-0.3rem] z-1 rounded-full p-3"
            onClick={() => selectSong(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {isExpanded && (
        <GradientBackground showGradient={isExpanded} isSong={true} />
      )}

      <MusicPlayerHeader
        isExpanded={isExpanded}
        handleMinimize={handleMinimize}
      />

      <div
        className={`transition-all duration-500 ease-in-out ${isExpanded ? 'flex h-[100%] max-h-[100%] flex-1 px-8 pb-8' : 'p-4'} ${isTablet ? 'flex-col items-center' : ''}`}
      >
        <MusicPlayerCover
          cover={cover}
          isExpanded={isExpanded}
          title={currentSong.title}
          subtitle={album.title}
          handleMinimize={handleMinimize}
          handleExpand={handleExpand}
          isCoverHovered={isCoverHovered}
          setIsCoverHovered={setIsCoverHovered}
        />

        {!isMobile && (
          <div
            className={`transition-all delay-300 duration-600 ease-in-out ${
              isExpanded
                ? `translate-x-0 opacity-100 ${isTablet ? 'h-[30dvh] max-h-[30dvh] min-h-[30dvh] w-full' : 'w-2/5'}`
                : 'pointer-events-none absolute translate-x-8 opacity-0 transition-none'
            }`}
          >
            <Menu />
          </div>
        )}
      </div>

      <DesktopCompactControls
        isHovered={isHovered}
        handlePrevious={handlePrevious}
        handlePlayPause={togglePlayPause}
        handleNext={handleNext}
      />

      <div
        className={
          isExpanded
            ? `${isMobile ? 'h-fit w-full' : 'h-35 w-full'}`
            : 'h-fit w-fit'
        }
      >
        <MusicControlsExpanded
          title={currentSong.title}
          subtitle={album.title}
          handlePrevious={handlePrevious}
          handlePlayPause={togglePlayPause}
          handleNext={handleNext}
          handleChangeRepeatState={handleChangeRepeatState}
        />
      </div>

      {isExpanded && isMobile && (
        <div>
          <Menu />
        </div>
      )}

      <audio
        ref={audioRef}
        src={`https://${selectedServer?.ip}/audio?path=${currentSong.fileSrc}`}
        onError={(e) => console.error('Audio loading error:', e)}
        autoPlay
      >
        {t('audioNotSupported')}
      </audio>
    </div>
  )
}

export default memo(MusicPlayer)
