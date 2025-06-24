import { useEffect, useState } from 'react'
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
  const { currentSong, songQueue } = useMusicStore()

  // Get Album details
  const { data: album } = useSWR<Album>(
    currentSong && selectedServer
      ? `https://${selectedServer.ip}/details/album?id=${currentSong.albumId}`
      : null,
    fetcher,
  )

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

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

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || isExpanded) return

    const newY = e.clientY - startY
    const maxY = window.innerHeight - 200 // Evitar que se salga por abajo
    const minY = 16 // Mínimo margen superior

    const clampedY = Math.max(minY, Math.min(maxY, newY))
    setCurrentY(clampedY)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

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
      className={`fixed z-40 ${isDragging ? 'cursor-grabbing transition-none' : 'cursor-grab transition-all duration-700 ease-in-out'} ${
        isExpanded
          ? 'inset-0 cursor-default bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900'
          : 'right-4 w-80 rounded-2xl border border-white/20 bg-white/45 shadow-2xl backdrop-blur-sm'
      }`}
      style={{
        top: isExpanded ? 0 : `${currentY}px`,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => !isExpanded && setIsHovered(false)}
    >
      {/* Header - Solo visible en modo expandido */}
      <MusicPlayerHeader
        isExpanded={isExpanded}
        handleMinimize={handleMinimize}
      />

      {/* Contenido principal */}
      <div
        className={`transition-all duration-700 ease-in-out ${isExpanded ? 'flex h-full max-h-[70dvh] flex-1 px-8 pb-8' : 'p-4'}`}
      >
        {/* Sección izquierda - Carátula */}
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
          className={`transition-all delay-300 duration-700 ease-in-out ${
            isExpanded
              ? 'w-2/5 translate-x-0 pl-8 opacity-100'
              : 'pointer-events-none absolute translate-x-8 opacity-0'
          }`}
        >
          <Menu />
        </div>
      </div>

      {/* Controles compactos - Solo en modo compacto */}
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

      {/* Controles expandidos - Solo en modo expandido */}
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
