import { useState, useRef, useEffect, memo, useLayoutEffect } from 'react'
import GradientBackground from '@/layouts/backgrounds/GradientBackground'
import Image from '@/components/ui/Image'
import useMusicStore from '@/context/music.context'
import MinimizedBar from './controls/MinimizedBar'
import ExpandedMobileMusicControls from './controls/ExpandedMobileMusicControls'

const MobileMusicPlayer = () => {
  const { album, isExpanded, setIsExpanded, isShown } = useMusicStore(
    (state) => ({
      album: state.album,
      isExpanded: state.isExpanded,
      setIsExpanded: state.setIsExpanded,
      isShown: state.isShown,
    }),
  )
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState<number | null>(0)
  const [isDragging, setIsDragging] = useState(false)
  const playerRef = useRef<HTMLInputElement | null>(null)
  const controlsRef = useRef<HTMLDivElement | null>(null)
  const startY = useRef(0)

  const [expandedCoverStyles, setExpandedCoverStyles] = useState({
    size: 56,
    left: 16,
    top: 12,
  })

  const minimizedHeight = 80 // Height of the minimized player (in pixels)
  const maxHeight = window.innerHeight // Full screen height

  // Calculate expandProgress
  const calculateExpandProgress = () => {
    if (!isDragging) {
      return isExpanded ? 1 : 0
    }
    if (dragOffset === null) return isExpanded ? 1 : 0
    const maxDrag = window.innerHeight * 0.8
    if (isExpanded) {
      // Dragging down when expanded
      return Math.max(0, 1 - Math.abs(dragOffset) / maxDrag)
    }
    // Dragging up when minimized
    return Math.min(1, Math.abs(dragOffset) / maxDrag)
  }

  const expandProgress = calculateExpandProgress()

  // Interpolate player height
  const currentHeight =
    minimizedHeight + (maxHeight - minimizedHeight) * expandProgress

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setDragStart(touch.clientY)
    setIsDragging(true)
    startY.current = touch.clientY
    setDragOffset(0)
  }

  const handleTouchMove = (e: any) => {
    if (!isDragging || !dragStart) return
    const touch = e.touches[0]
    const deltaY = isExpanded
      ? touch.clientY - dragStart
      : dragStart - touch.clientY
    const maxDrag = window.innerHeight * 0.8

    // Verificar si el toque está fuera del viewport (arriba o abajo)
    if (touch.clientY < 0 || touch.clientY > window.innerHeight + 50) {
      handleTouchEnd()
      return
    }

    // Forzar handleTouchEnd si el arrastre excede maxDrag
    const absDeltaY = Math.abs(deltaY)
    if (absDeltaY > maxDrag) {
      handleTouchEnd()
      return
    }

    const clampedDelta = Math.max(0, Math.min(Math.abs(deltaY), maxDrag))
    setDragOffset(isExpanded ? -clampedDelta : clampedDelta)
    e.preventDefault()
  }

  const handleTouchEnd = () => {
    if (!isDragging || dragOffset === null) return
    const maxDrag = window.innerHeight * 0.8
    const absDragOffset = Math.abs(dragOffset)

    // If dragged beyond maxDrag, set the final state immediately
    if (absDragOffset >= maxDrag) {
      if (isExpanded && dragOffset <= 0) {
        setIsExpanded(false) // Dragged down fully when expanded -> minimize
      } else if (!isExpanded && dragOffset > 0) {
        setIsExpanded(true) // Dragged up fully when minimized -> expand
      }
    } else {
      // Existing threshold logic for partial drags
      const threshold = window.innerHeight * 0.2
      if (absDragOffset > threshold) {
        if (isExpanded && dragOffset <= 0) {
          setIsExpanded(false)
        } else if (!isExpanded && dragOffset > 0) {
          setIsExpanded(true)
        }
      }
    }

    setIsDragging(false)
    setDragStart(null)
    setDragOffset(0)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isExpanded) {
      setDragStart(e.clientY)
      setIsDragging(true)
      setDragOffset(0)
    } else {
      setIsExpanded(true)
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !dragStart) return
    const deltaY = isExpanded ? e.clientY - dragStart : dragStart - e.clientY
    const maxDrag = window.innerHeight * 0.8
    const clampedDelta = Math.max(0, Math.min(Math.abs(deltaY), maxDrag))
    setDragOffset(isExpanded ? -clampedDelta : clampedDelta)
  }

  const handleMouseUp = () => {
    if (!isDragging || dragOffset === null) return
    const maxDrag = window.innerHeight * 0.8
    const absDragOffset = Math.abs(dragOffset)

    // If dragged beyond maxDrag, set the final state immediately
    if (absDragOffset >= maxDrag) {
      if (isExpanded && dragOffset < 0) {
        setIsExpanded(false) // Dragged down fully when expanded -> minimize
      } else if (!isExpanded && dragOffset > 0) {
        setIsExpanded(true) // Dragged up fully when minimized -> expand
      }
    } else {
      // Existing threshold logic for partial drags
      const threshold = window.innerHeight * 0.2
      if (absDragOffset > threshold) {
        if (isExpanded && dragOffset < 0) {
          setIsExpanded(false)
        } else if (!isExpanded && dragOffset > 0) {
          setIsExpanded(true)
        }
      }
    }

    setIsDragging(false)
    setDragStart(null)
    setDragOffset(0)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('touchend', handleTouchEnd)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, dragStart, dragOffset, isExpanded])

  const calculateExpandedCoverStyles = () => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const headerHeight = 80
    let controlsHeight = 320
    if (controlsRef.current) {
      const controlsContent = controlsRef.current.querySelector(
        '[data-controls-content]',
      ) as HTMLElement
      if (controlsContent) {
        controlsHeight = controlsContent.offsetHeight
      }
    }
    const horizontalMargin = 32
    const verticalMargin = 20
    const maxWidth = viewportWidth - horizontalMargin
    const availableHeight =
      viewportHeight - headerHeight - controlsHeight - verticalMargin * 2
    let size = Math.min(maxWidth, availableHeight)
    const minSize = 180
    const maxSize = viewportWidth * 0.9
    size = Math.max(minSize, Math.min(size, maxSize))
    const totalVerticalSpace =
      headerHeight + size + controlsHeight + verticalMargin * 2
    if (totalVerticalSpace > viewportHeight) {
      const excessHeight = totalVerticalSpace - viewportHeight
      size = Math.max(minSize, size - excessHeight - 20)
    }
    const left = (viewportWidth - size) / 2
    const availableVerticalSpace =
      viewportHeight - headerHeight - controlsHeight
    const top = headerHeight + (availableVerticalSpace - size) / 2
    const minTopWithMargin = headerHeight + 10
    const maxTopWithMargin = viewportHeight - controlsHeight - size - 10
    const finalTop = Math.max(minTopWithMargin, Math.min(top, maxTopWithMargin))

    return { size, left, top }
  }

  useLayoutEffect(() => {
    const newExpandedStyles = calculateExpandedCoverStyles()
    setExpandedCoverStyles(newExpandedStyles)
  }, [isExpanded, isDragging])

  useEffect(() => {
    const handleResize = () => {
      const newExpandedStyles = calculateExpandedCoverStyles()
      setExpandedCoverStyles(newExpandedStyles)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const barOpacity = Math.max(0, 1 - expandProgress * 2)
  const controlsOpacity = Math.max(0, expandProgress)
  const controlsTransform = `translateY(${(1 - expandProgress) * 40}px)`

  const minimizedSize = 56
  const minimizedLeft = 16
  const minimizedTop = 12

  const currentSize =
    minimizedSize + (expandedCoverStyles.size - minimizedSize) * expandProgress
  const currentLeft =
    minimizedLeft + (expandedCoverStyles.left - minimizedLeft) * expandProgress
  const currentTop =
    minimizedTop + (expandedCoverStyles.top - minimizedTop) * expandProgress

  const handleBarClick = () => {
    if (!isDragging && !isExpanded) {
      setIsExpanded(true)
    }
  }

  return (
    <div className="absolute h-screen w-full overflow-hidden bg-transparent">
      <div
        ref={playerRef}
        className={`fixed right-0 bottom-0 left-0 z-50 bg-black`}
        style={{
          height: `${currentHeight}px`,
          pointerEvents: 'auto',
          transform: isShown ? 'translateY(0)' : 'translateY(100%)',
          transition: isDragging ? 'none' : 'all 0.3s ease',
        }}
        onTouchStart={handleTouchStart}
        onMouseDown={handleMouseDown}
      >
        {/* Background */}
        {(isExpanded || expandProgress > 0) && (
          <GradientBackground isSong showGradient={expandProgress > 0} />
        )}

        {/* Minimized Player */}
        <MinimizedBar
          barOpacity={barOpacity}
          handleMouseDown={handleMouseDown}
          handleTouchStart={handleTouchStart}
          handleBarClick={handleBarClick}
        />

        {/* Animated Cover */}
        <div
          className="absolute overflow-hidden rounded-lg shadow-lg"
          style={{
            width: `${currentSize}px`,
            height: `${currentSize}px`,
            left: `${currentLeft}px`,
            top: `${currentTop}px`,
            zIndex: expandProgress > 0 ? 60 : 10,
            transition: isDragging ? 'none' : 'all 0.3s ease-out',
          }}
        >
          <Image
            url={album?.coverSrc ?? ''}
            alt={'Music Player Cover'}
            aspectRatio={1}
            className="h-full w-full rounded-lg object-cover"
          />
        </div>

        {/* Expanded Player */}
        {expandProgress > 0 && (
          <ExpandedMobileMusicControls
            ref={controlsRef}
            controlsOpacity={controlsOpacity}
            controlsTransform={controlsTransform}
          />
        )}
      </div>
    </div>
  )
}

export default memo(MobileMusicPlayer)
