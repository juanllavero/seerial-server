import React, { useEffect, useRef, useState } from 'react'
import DragWindowRegion from '@/components/DragWindowRegion'
import '../styles/utils.css'
import './BaseLayout.css'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { selectedSeason } = useDataStore()
  const { serverIP } = useServerStore()
  const prevBackground = useRef(selectedSeason?.backgroundSrc)
  const [showNewImage, setShowNewImage] = useState(false)

  useEffect(() => {
    console.log({ selectedSeason, prevBackground })

    if (!selectedSeason) {
      prevBackground.current = undefined
      setShowNewImage(false)
      return
    }

    if (selectedSeason.backgroundSrc === prevBackground.current) return

    setShowNewImage(true)

    const timeout = setTimeout(() => {
      prevBackground.current = selectedSeason.backgroundSrc
      setShowNewImage(false)
    }, 500)

    return () => clearTimeout(timeout)
  }, [selectedSeason])

  const getSafeURL = (url: string | undefined) => {
    return url ? url.replace(/\\/g, '/') : ''
  }

  return (
    <div className="relative">
      {/* Imagen actual (desaparece si selectedSeason es null) */}
      <div
        className="background-layer"
        style={{
          backgroundImage: prevBackground.current
            ? `url(${prevBackground.current.startsWith('http') ? getSafeURL(prevBackground.current) : `https://${serverIP}/${getSafeURL(prevBackground.current)}`})`
            : 'none',
          opacity: prevBackground.current ? 1 : 0, // Hace la imagen invisible si no hay fondo
        }}
      />
      {/* Imagen nueva que se desvanece */}
      {/*showNewImage && selectedSeason?.backgroundSrc && (
        <div
          className="background-layer fade-in"
          style={{
            backgroundImage: `url(${selectedSeason.backgroundSrc.startsWith('http') ? getSafeURL(selectedSeason.backgroundSrc) : `https://${serverIP}/${getSafeURL(selectedSeason.backgroundSrc)}`})`,
          }}
        />
      )*/}

      <DragWindowRegion />
      <main className="h-screen w-screen">{children}</main>
    </div>
  )
}
