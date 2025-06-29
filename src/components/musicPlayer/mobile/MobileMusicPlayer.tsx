import { useState, useRef, useEffect, memo, useLayoutEffect } from 'react'
import GradientBackground from '@/layouts/backgrounds/GradientBackground'
import Image from '@/components/ui/Image'
import useMusicStore from '@/context/music.context'
import MinimizedBar from './controls/MinimizedBar'
import ExpandedMobileMusicControls from './controls/ExpandedMobileMusicControls'

const MobileMusicPlayer = () => {
  const { album, isExpanded, setIsExpanded } = useMusicStore()
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState<number | null>(0)
  const [isDragging, setIsDragging] = useState(false)
  const playerRef = useRef<HTMLInputElement | null>(null)
  const controlsRef = useRef<HTMLDivElement | null>(null)
  const startY = useRef(0)

  // Estado para las dimensiones calculadas de la carátula
  const [coverStyles, setCoverStyles] = useState({
    size: 56,
    left: 16,
    top: 12,
  })

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isExpanded) return

    const touch = e.touches[0]
    setDragStart(touch.clientY)
    setIsDragging(true)
    startY.current = touch.clientY
    setDragOffset(0)
  }

  const handleTouchMove = (e: any) => {
    if (!isDragging || !dragStart || isExpanded) return

    const touch = e.touches[0]
    const deltaY = dragStart - touch.clientY
    const maxDrag = window.innerHeight * 0.8
    const clampedDelta = Math.max(0, Math.min(deltaY, maxDrag))

    setDragOffset(clampedDelta)
    e.preventDefault()
  }

  const handleTouchEnd = () => {
    if (!isDragging || !dragOffset) return

    const threshold = window.innerHeight * 0.2

    if (dragOffset > threshold) {
      setIsExpanded(true)
    }

    setIsDragging(false)
    setDragStart(null)
    setDragOffset(0)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isExpanded) return
    setIsExpanded(true)
  }

  const handleMouseMove = (e: any) => {
    if (!isDragging || !dragStart || isExpanded) return

    const deltaY = dragStart - e.clientY
    const maxDrag = window.innerHeight * 0.8
    const clampedDelta = Math.max(0, Math.min(deltaY, maxDrag))

    setDragOffset(clampedDelta)
  }

  const handleMouseUp = () => {
    if (!isDragging || !dragOffset) return

    const threshold = window.innerHeight * 0.2

    if (dragOffset > threshold) {
      setIsExpanded(true)
    }

    setIsDragging(false)
    setDragStart(null)
    setDragOffset(0)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove, {
        passive: false,
      })
      document.addEventListener('touchend', handleTouchEnd)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, dragStart, dragOffset])

  // Función para calcular las dimensiones correctas de la carátula expandida
  const calculateExpandedCoverStyles = () => {
    if (!isExpanded) return coverStyles

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Esperamos un frame para que el DOM se actualice
    requestAnimationFrame(() => {
      // Altura del header (botones de cerrar)
      const headerHeight = 80

      // Obtenemos la altura real de los controles desde el DOM
      let controlsHeight = 320 // Fallback
      if (controlsRef.current) {
        // Medimos solo la parte de controles (excluyendo el header)
        const controlsContent = controlsRef.current.querySelector(
          '[data-controls-content]',
        ) as HTMLElement
        if (controlsContent) {
          controlsHeight = controlsContent.offsetHeight
        }
      }

      // Márgenes
      const horizontalMargin = 32 // Margen total (16px cada lado)
      const verticalMargin = 20

      // PRIORIZAR ANCHO: Calculamos el ancho máximo disponible
      const maxWidth = viewportWidth - horizontalMargin

      // Espacio vertical disponible para la imagen
      const availableHeight =
        viewportHeight - headerHeight - controlsHeight - verticalMargin * 2

      // La imagen es cuadrada, por lo que el tamaño será el menor entre:
      // 1. El ancho máximo disponible
      // 2. La altura máxima disponible
      let size = Math.min(maxWidth, availableHeight)

      // Establecemos límites razonables
      const minSize = 180
      const maxSize = viewportWidth * 0.9 // Aumentamos el límite máximo
      size = Math.max(minSize, Math.min(size, maxSize))

      // Verificación final: asegurar que cabe verticalmente
      const totalVerticalSpace =
        headerHeight + size + controlsHeight + verticalMargin * 2
      if (totalVerticalSpace > viewportHeight) {
        // Si no cabe, reducimos el tamaño para que quepa
        const excessHeight = totalVerticalSpace - viewportHeight
        size = Math.max(minSize, size - excessHeight - 20) // 20px de margen adicional
      }

      // Posicionamiento: centrado horizontalmente
      const left = (viewportWidth - size) / 2

      // Posicionamiento vertical: centrado en el espacio disponible
      const availableVerticalSpace =
        viewportHeight - headerHeight - controlsHeight
      const top = headerHeight + (availableVerticalSpace - size) / 2

      // Asegurar que está dentro de los límites con márgenes mínimos
      const minTopWithMargin = headerHeight + 10
      const maxTopWithMargin = viewportHeight - controlsHeight - size - 10

      const finalTop = Math.max(
        minTopWithMargin,
        Math.min(top, maxTopWithMargin),
      )

      const newStyles = {
        size: size,
        left: left,
        top: finalTop,
      }

      setCoverStyles(newStyles)
    })

    return coverStyles // Retornamos el estado actual mientras se calcula
  }

  // useLayoutEffect para recalcular cuando sea necesario
  useLayoutEffect(() => {
    if (isExpanded) {
      // Pequeño delay para asegurar que el DOM esté actualizado
      const timeoutId = setTimeout(() => {
        calculateExpandedCoverStyles()
      }, 10)

      return () => clearTimeout(timeoutId)
    } else {
      // Valores para estado minimizado
      setCoverStyles({
        size: 56,
        left: 16,
        top: 12,
      })
    }
  }, [isExpanded])

  // Listener para redimensionamiento de ventana
  useEffect(() => {
    const handleResize = () => {
      if (isExpanded) {
        calculateExpandedCoverStyles()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isExpanded])

  // Calcular el progreso de expansión
  const expandProgress = isExpanded
    ? 1
    : dragOffset
      ? Math.min(dragOffset / (window.innerHeight * 0.8), 1)
      : 0

  const barOpacity = Math.max(0, 1 - expandProgress * 2)
  const controlsOpacity = Math.max(0, expandProgress)
  const controlsTransform = `translateY(${(1 - expandProgress) * 40}px)`

  // Dimensiones actuales de la carátula
  const minimizedSize = 56
  const minimizedLeft = 16
  const minimizedTop = 12

  // Interpolación entre estados
  const currentSize =
    minimizedSize + (coverStyles.size - minimizedSize) * expandProgress
  const currentLeft =
    minimizedLeft + (coverStyles.left - minimizedLeft) * expandProgress
  const currentTop =
    minimizedTop + (coverStyles.top - minimizedTop) * expandProgress

  const handleBarClick = (e: any) => {
    if (!isDragging && !isExpanded) {
      setIsExpanded(true)
    }
  }

  return (
    <div className="absolute h-screen w-full overflow-hidden bg-transparent">
      <div
        ref={playerRef}
        className={`fixed right-0 bottom-0 left-0 z-50 bg-black transition-all duration-300 ${
          isExpanded ? 'h-full' : 'h-20'
        }`}
        style={{
          pointerEvents: 'auto',
          transform:
            isDragging && !isExpanded
              ? `translateY(-${dragOffset}px)`
              : 'translateY(0)',
        }}
      >
        {/* Background */}
        {(isExpanded || (dragOffset && dragOffset > 0)) && (
          <GradientBackground isSong showGradient={isExpanded} />
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
          className="absolute overflow-hidden rounded-lg shadow-lg transition-all duration-300 ease-out"
          style={{
            width: `${currentSize}px`,
            height: `${currentSize}px`,
            left: `${currentLeft}px`,
            top: `${currentTop}px`,
            zIndex: isExpanded || (dragOffset && dragOffset > 0) ? 60 : 10,
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
        {(isExpanded || (dragOffset && dragOffset > 0)) && (
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
