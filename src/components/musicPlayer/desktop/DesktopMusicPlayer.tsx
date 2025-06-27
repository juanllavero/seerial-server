import { useEffect, useState } from 'react'
import GradientBackground from '@/layouts/backgrounds/GradientBackground'
import { X } from 'lucide-react'
import { memo } from 'react'
import useMusicStore from '@/context/music.context'
import { useIsTablet } from '@/components/hooks/use-tablet'
import { Button } from '@/components/ui/button'
import DesktopCompactControls from '../controls/DesktopCompactControls'
import MusicControlsExpanded from '../controls/MusicControlsExpanded'
import MusicPlayerCover from '../cover/Cover'
import MusicPlayerHeader from '../header/Header'
import Menu from '../menu/Lyrics'
import NextSongs from '../menu/NextSongs'
import Lyrics from '../menu/Lyrics'

function DesktopMusicPlayer() {
  const {
    album,
    isExpanded,
    currentSong,
    showLyrics,
    showQueue,
    selectSong,
    setIsExpanded,
    togglePlayPause,
    handleChangeRepeatState,
    handlePrevious,
    handleNext,
  } = useMusicStore()
  const [isHovered, setIsHovered] = useState(false)
  const [isCoverHovered, setIsCoverHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(16)

  // Handle dragging
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

  if (!album || !currentSong) return null

  const cover = album.coverSrc

  return (
    <div
      className={`fixed z-40 ${isDragging ? 'cursor-grabbing transition-none' : `transition-all duration-500 ease-in-out ${isExpanded ? 'cursor-default' : 'cursor-grab'}`} ${
        isExpanded
          ? 'inset-0 flex h-full cursor-default flex-col bg-gray-700'
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
        className={`transition-all duration-500 ease-in-out ${isExpanded ? `flex max-h-full min-h-0 flex-1 justify-between gap-10 p-10 pt-0 pb-0 ${showQueue ? '' : 'pr-0'}` : 'p-4'}`}
      >
        {!showLyrics || !isExpanded ? (
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
        ) : (
          <Lyrics />
        )}

        <div
          className={`pt-20 pb-10 transition-all delay-0 duration-600 ease-in-out ${
            isExpanded
              ? showQueue
                ? 'w-100 flex-1 translate-x-0 opacity-100'
                : 'pointer-events-none w-0 translate-x-20 opacity-100 transition-all'
              : 'pointer-events-none absolute translate-x-8 opacity-0 transition-none'
          }`}
        >
          <NextSongs />
        </div>
      </div>

      <DesktopCompactControls
        isHovered={isHovered}
        handlePrevious={handlePrevious}
        handlePlayPause={togglePlayPause}
        handleNext={handleNext}
      />

      <MusicControlsExpanded
        title={currentSong.title}
        subtitle={album.title}
        handlePrevious={handlePrevious}
        handlePlayPause={togglePlayPause}
        handleNext={handleNext}
        handleChangeRepeatState={handleChangeRepeatState}
      />
    </div>
  )
}

export default memo(DesktopMusicPlayer)
