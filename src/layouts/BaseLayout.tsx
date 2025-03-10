import React, { useEffect, useRef, useState } from 'react'
import DragWindowRegion from '@/components/DragWindowRegion'
import '../styles/utils.css'
import './BaseLayout.css'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { useLocation } from '@tanstack/react-router'

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { selectedSeason } = useDataStore()
  const { serverIP } = useServerStore()
  const prevBackground = useRef<string | undefined>(undefined)
  const [currentBackground, setCurrentBackground] = useState<
    string | undefined
  >(undefined)
  const [showNewImage, setShowNewImage] = useState(false)

  // Check if current location is details page
  const location = useLocation()
  const inDetailsPage = location.pathname.startsWith('/details/')

  useEffect(() => {
    if (!selectedSeason || !selectedSeason.backgroundSrc) {
      setCurrentBackground(undefined)
      prevBackground.current = undefined
      setShowNewImage(false)
      return
    }

    const newBackground = selectedSeason.backgroundSrc

    // Si no había fondo previo, establecer directamente sin animación
    if (!prevBackground.current) {
      setCurrentBackground(newBackground)
      prevBackground.current = newBackground
      setShowNewImage(false)
      return
    }

    // Si hay un cambio de imagen, activar la animación
    if (newBackground !== prevBackground.current) {
      setShowNewImage(true)

      const timeout = setTimeout(() => {
        setCurrentBackground(newBackground)
        prevBackground.current = newBackground
        setShowNewImage(false)
      }, 500)

      return () => clearTimeout(timeout)
    }
  }, [selectedSeason])

  const getSafeURL = (url: string | undefined) => {
    return url ? url.replace(/\\/g, '/') : ''
  }

  return (
    <div className="relative">
      {/* Imagen actual */}
      <div
        className="background-layer"
        style={{
          backgroundImage:
            inDetailsPage && currentBackground
              ? `url(${currentBackground.startsWith('http') ? getSafeURL(currentBackground) : `https://${serverIP}/${getSafeURL(currentBackground)}`})`
              : 'none',
          opacity: inDetailsPage && currentBackground ? 1 : 0,
        }}
      />
      {/* Imagen nueva que se desvanece */}
      {showNewImage && selectedSeason?.backgroundSrc && (
        <div
          className="background-layer fade-in"
          style={{
            backgroundImage: `url(${selectedSeason.backgroundSrc.startsWith('http') ? getSafeURL(selectedSeason.backgroundSrc) : `https://${serverIP}/${getSafeURL(selectedSeason.backgroundSrc)}`})`,
          }}
        />
      )}

      <DragWindowRegion />
      <main className="h-screen w-screen">{children}</main>
    </div>
  )
}
