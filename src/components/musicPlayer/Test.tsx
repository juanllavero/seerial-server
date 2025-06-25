import { useEffect, useRef, useState } from 'react'
import { Album } from '@/data/interfaces/Music'
import { fetcher } from '@/utils/utils'
import useSWR from 'swr'
import { useServerStore } from '@/context/server.context'
import useMusicStore from '@/context/music.context'
import Menu from './menu/Menu'
import MusicPlayerHeader from './header/Header'
import MusicPlayerCover from './cover/Cover'
import DesktopCompactControls from './controls/DesktopCompactControls'
import MusicControlsExpanded from './controls/MusicControlsExpanded'
import { ReactUtils } from '@/utils/ReactUtils'
import GradientBackground from '@/layouts/backgrounds/GradientBackground'
import { Button } from '../ui/button'
import { Cross, X } from 'lucide-react'

export default function MusicPlayer2() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState([30])
  const [volume, setVolume] = useState([75])
  const [isHovered, setIsHovered] = useState(false)
  const [isCoverHovered, setIsCoverHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(16) // 16px = top-4 inicial

  const { selectedServer } = useServerStore()
  const { currentSong, songQueue, selectSong } = useMusicStore()

  // Get Album details
  const { data: album } = useSWR<Album>(
    currentSong && currentSong.albumId && selectedServer
      ? `https://${selectedServer.ip}/details/album?id=${currentSong.albumId}`
      : null,
    fetcher,
  )

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handlePrevious = () => {
    //selectSong((prev) => (prev > 0 ? prev - 1 : playlist.length - 1))
  }

  const handleNext = () => {
    //setCurrentSong((prev) => (prev < playlist.length - 1 ? prev + 1 : 0))
  }

  const handleSongSelect = (index: number) => {
    //setCurrentSong(index)
    setIsPlaying(true)
  }

  const handleExpand = () => {
    setIsExpanded(true)
  }

  const handleMinimize = () => {
    setIsExpanded(false)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isExpanded) return // No permitir arrastrar en modo expandido

    setIsDragging(true)
    setStartY(e.clientY - currentY)
    e.preventDefault()
  }

  useEffect(() => {
    if (album && selectedServer) {
      ReactUtils.generateGradient(album.coverSrc, selectedServer.ip, true)
    }
  }, [album])

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

  const currentTime = Math.floor((progress[0] / 100) * currentSong.duration)
  const cover = album.coverSrc

  return (
    <div
      className={`fixed z-40 ${isDragging ? 'cursor-grabbing transition-none' : 'cursor-grab transition-all duration-500 ease-in-out'} ${
        isExpanded
          ? 'inset-0 cursor-default bg-gray-700'
          : 'right-4 w-80 rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-sm'
      }`}
      style={{
        top: isExpanded ? 0 : `${currentY}px`,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => !isExpanded && setIsHovered(false)}
    >
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

      {/* Background Gradient */}
      <GradientBackground showGradient={isExpanded} isSong={true} />

      {/* Header - Expanded Mode */}
      <MusicPlayerHeader
        isExpanded={isExpanded}
        handleMinimize={handleMinimize}
      />

      {/* Content */}
      <div
        className={`transition-all duration-500 ease-in-out ${isExpanded ? 'flex h-full max-h-[70dvh] flex-1 px-8 pb-8' : 'p-4'}`}
      >
        {/* Cover */}
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

        {/* Right Menu Section - Expanded Mode */}
        <div
          className={`transition-all delay-300 duration-600 ease-in-out ${
            isExpanded
              ? 'w-2/5 translate-x-0 pl-8 opacity-100'
              : 'pointer-events-none absolute translate-x-8 opacity-0 transition-none'
          }`}
        >
          <Menu />
        </div>
      </div>

      {/* Compact Controls */}
      <DesktopCompactControls
        isPlaying={isPlaying}
        isHovered={isHovered}
        handlePrevious={handlePrevious}
        handlePlayPause={handlePlayPause}
        handleNext={handleNext}
        isExpanded={isExpanded}
        duration={currentSong.duration}
        currentTime={currentTime}
      />

      {/* Expanded Controls */}
      <MusicControlsExpanded
        isExpanded={isExpanded}
        currentTime={currentTime}
        title={currentSong.title}
        subtitle={album.title}
        duration={currentSong.duration}
        isPlaying={isPlaying}
        handlePrevious={handlePrevious}
        handlePlayPause={handlePlayPause}
        handleNext={handleNext}
      />
    </div>
  )
}
