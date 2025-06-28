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

  // NUEVO: Estado para guardar los estilos calculados de la carátula maximizada.
  const [maximizedCoverStyle, setMaximizedCoverStyle] = useState({
    width: 0,
    top: 0,
    left: 0,
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
    //  setDragStart(e.clientY)
    //  setIsDragging(true)
    //  startY.current = e.clientY
    //  setDragOffset(0)
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

  // NUEVO: useEffect para calcular las dimensiones cuando se expande o cambia el tamaño de la ventana.
  useEffect(() => {
    const calculateStyles = () => {
      if (!isExpanded) return

      const controlsHeight = controlsRef.current?.offsetHeight || 280 // Un valor por defecto razonable
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      // Márgenes para que la imagen no toque los bordes
      const horizontalMargin = 32 // 16px a cada lado
      const topMargin = window.screen.height - viewportHeight > 0 ? 60 : 40 // Espacio para la barra de estado superior
      const bottomMargin = 20 // Espacio entre la imagen y los controles

      const availableWidth = viewportWidth - horizontalMargin
      const availableHeight =
        viewportHeight - controlsHeight - topMargin - bottomMargin

      // El tamaño de la carátula (es un cuadrado) será el menor entre el ancho y alto disponible
      const size = Math.min(availableWidth, availableHeight)

      const top = topMargin + (availableHeight - size) / 2
      const left = (viewportWidth - size) / 2

      setMaximizedCoverStyle({ width: size, top, left })
    }

    calculateStyles() // Calcular al cambiar isExpanded

    window.addEventListener('resize', calculateStyles)
    return () => window.removeEventListener('resize', calculateStyles)
  }, [isExpanded])

  const expandProgress = isExpanded
    ? 1
    : dragOffset
      ? Math.min(dragOffset / (window.innerHeight * 0.8), 1)
      : 0
  const barOpacity = Math.max(0, 1 - expandProgress * 2)
  const controlsOpacity = Math.max(0, expandProgress)
  const controlsTransform = `translateY(${(1 - expandProgress) * 40}px)`

  // --- MODIFICADO: Cálculo de posición y tamaño de la carátula ---

  // Valores cuando está minimizado
  const minSize = 56
  const minLeft = 16
  // El top inicial es (altura_barra / 2) - (altura_imagen / 2) => (80 / 2) - (56 / 2) = 12
  const minTop = 12

  // Valores finales (maximizados) desde nuestro estado dinámico
  // Usamos los valores mínimos como fallback por si el cálculo aún no ha terminado.
  const finalSize = maximizedCoverStyle.width || minSize
  const finalTop = maximizedCoverStyle.top || minTop
  const finalLeft = maximizedCoverStyle.left || minLeft

  // Interpolamos todos los valores basándonos en el progreso de la expansión
  const coverSize = minSize + (finalSize - minSize) * expandProgress
  const coverLeft = minLeft + (finalLeft - minLeft) * expandProgress
  const coverTop = minTop + (finalTop - minTop) * expandProgress

  // Ya no necesitamos un transform condicional, ya que el 'top' es absoluto.
  const coverTransform = 'translateY(0)'

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
          // La transición se aplica a todos los cambios de propiedades
          className="absolute rounded-lg object-cover shadow-lg transition-all duration-300"
          style={{
            // Usamos nuestras nuevas variables interpoladas
            width: `${coverSize}px`,
            height: `${coverSize}px`,
            left: `${coverLeft}px`,
            top: `${coverTop}px`, // transform: coverTransform,
            // Ya no es necesario el transform condicional
            zIndex: isExpanded || (dragOffset && dragOffset > 0) ? 60 : 10,
          }}
        >
          <Image
            url={album?.coverSrc ?? ''}
            alt={'Music Player Cover'}
            aspectRatio={1}
            // Clases para asegurar que la imagen llene su contenedor
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
