import { Skeleton } from '@/components/ui/skeleton'
import React, { useState, useRef } from 'react'

function VideoPlayer({
  videoUrl,
  snapshotAtTime = 10,
}: {
  videoUrl: string
  snapshotAtTime?: number
}) {
  // --- Estados ---
  // Almacena la URL de la miniatura generada
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  // Controla si el cursor está sobre el componente
  const [isHovering, setIsHovering] = useState(false)
  // Para saber si es la primera vez que se reproduce
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false)
  // Manejo de errores (p. ej., por CORS)
  const [error, setError] = useState<string | null>(null)

  // --- Referencias a elementos del DOM ---
  const videoRef = useRef<HTMLVideoElement>(null)

  // --- Lógica para Generar la Miniatura ---
  const generateThumbnail = () => {
    if (thumbnail) return

    const video = videoRef.current
    if (!video) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')

    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    try {
      const thumbnailUrl = canvas.toDataURL('image/jpeg')
      setThumbnail(thumbnailUrl)
    } catch (e) {
      console.error(e)
      setError(
        'No se pudo generar el thumbnail. Revisa la consola para ver errores de CORS.',
      )
    }
  }

  const handleVideoLoad = () => {
    const video = videoRef.current
    if (video) {
      // Busca el instante de tiempo para la captura
      video.currentTime = snapshotAtTime
    }
  }

  // --- Manejadores de Eventos para el Hover ---
  const handleMouseEnter = () => {
    setIsHovering(true)
    const video = videoRef.current
    if (video) {
      // Si es la primera vez, nos aseguramos de que empiece desde el segundo 0
      if (!hasPlayedOnce) {
        video.currentTime = 0
        setHasPlayedOnce(true)
      }
      // El método play() devuelve una promesa, es buena práctica capturar errores
      video
        .play()
        .catch((err) => console.error('Error al intentar reproducir:', err))
    }
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    const video = videoRef.current
    if (video) {
      video.pause()
    }
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="rounded-xl"
      style={{
        position: 'relative', // Contenedor base para posicionar la imagen y el vídeo
        width: '100%',
        maxWidth: '400px', // Ancho máximo de ejemplo
        aspectRatio: '16 / 9', // Mantiene la proporción del vídeo
        cursor: 'pointer',
        backgroundColor: '#000',
      }}
    >
      {/* El elemento de vídeo ahora es visible y se controla con opacidad */}
      <video
        ref={videoRef}
        src={videoUrl}
        onLoadedData={handleVideoLoad}
        onSeeked={generateThumbnail} // Genera la miniatura cuando la búsqueda de fotograma termina
        className="rounded-xl"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          opacity: isHovering ? 1 : 0, // Controla la visibilidad
          transition: 'opacity 0.4s ease-in-out', // La magia de la transición
        }}
        crossOrigin="anonymous"
        muted // Esencial para el autoplay en la mayoría de navegadores
        loop // Para que el vídeo se repita si llega al final
        playsInline // Importante para la reproducción en iOS
      />

      {/* La imagen de la miniatura */}
      {thumbnail && (
        <img
          src={thumbnail}
          alt="Video thumbnail"
          className="rounded-xl"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            opacity: isHovering ? 0 : 1, // Se oculta al hacer hover
            transition: 'opacity 0.4s ease-in-out',
            objectFit: 'cover',
          }}
        />
      )}

      {/* Mensaje de carga o error */}
      {!thumbnail && !error && (
        <Skeleton className="h-full w-full rounded-xl" />
      )}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  )
}

export default VideoPlayer
