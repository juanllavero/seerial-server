import DialogManager from '@/components/dialogs/DialogManager'
import DragWindowRegion from '@/components/DragWindowRegion'
import MusicPlayer from '@/components/musicPlayer/MusicPlayer'
import useDataStore from '@/context/data.context'
import { useServerStore } from '@/context/server.context'
import { getToken } from '@/lib/auth'
import { ReactUtils } from '@/utils/ReactUtils'
import { useLocation } from '@tanstack/react-router'
import React, { useEffect, useRef, useState } from 'react'
import { Toaster } from 'sonner'
import '../styles/utils.css'
import './BaseLayout.css'

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentBackground: selectedBackground } = useDataStore()
  const { serverIP } = useServerStore()
  const prevBackground = useRef<string | undefined>(undefined)
  const prevGradient = useRef<string | undefined>(undefined)
  const [currentBackground, setCurrentBackground] = useState<
    string | undefined
  >(undefined)
  const [currentGradient, setCurrentGradient] = useState<string | undefined>(
    undefined,
  ) // State for the current gradient
  const [showNewImage, setShowNewImage] = useState(false)
  const [showNewGradient, setShowNewGradient] = useState(false) // State for the new gradient

  const location = useLocation()
  const inDetailsPage =
    location.pathname.startsWith('/details/') ||
    location.pathname.startsWith('/episodeDetails/')

  useEffect(() => {
    if (selectedBackground) {
      ReactUtils.generateGradient(selectedBackground, serverIP)

      setTimeout(() => {
        const newGradient = ReactUtils.getGradientBackground()

        // If there is no previous gradient or it is different, activate the transition
        if (!prevGradient.current || newGradient !== prevGradient.current) {
          setShowNewGradient(true)

          const timeout = setTimeout(() => {
            setCurrentGradient(newGradient)
            prevGradient.current = newGradient
            setShowNewGradient(false)
          }, 500)

          return () => clearTimeout(timeout)
        }
      }, 500)
    } else {
      setCurrentGradient(undefined)
      prevGradient.current = undefined
      setShowNewGradient(false)
    }

    if (!selectedBackground) {
      setCurrentBackground(undefined)
      prevBackground.current = undefined
      setShowNewImage(false)
      return
    }

    const newBackground = selectedBackground

    if (!prevBackground.current) {
      setCurrentBackground(newBackground)
      prevBackground.current = newBackground
      setShowNewImage(false)
      return
    }

    if (newBackground !== prevBackground.current) {
      setShowNewImage(true)

      const timeout = setTimeout(() => {
        setCurrentBackground(newBackground)
        prevBackground.current = newBackground
        setShowNewImage(false)
      }, 500)

      return () => clearTimeout(timeout)
    }
  }, [selectedBackground])

  const getSafeURL = (url: string | undefined) => {
    return url ? url.replace(/\\/g, '/') : ''
  }

  return (
    <div className="relative">
      {/* Current background */}
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

      {/* New background that fades in */}
      {showNewImage && selectedBackground && (
        <div
          className="background-layer fade-in"
          style={{
            backgroundImage: `url(${selectedBackground.startsWith('http') ? getSafeURL(selectedBackground) : `https://${serverIP}/${getSafeURL(selectedBackground)}`})`,
          }}
        />
      )}

      {/* Current gradient */}
      {!selectedBackground && (
        <div
          className="background-gradient"
          style={{
            background:
              inDetailsPage && !currentBackground ? currentGradient : 'none',
          }}
        />
      )}

      {/* New gradient that fades in */}
      {showNewGradient && !selectedBackground && (
        <div
          className="background-gradient fade-in-slow"
          style={{
            background: inDetailsPage
              ? ReactUtils.getGradientBackground()
              : 'none',
          }}
        />
      )}

      {/* Toaster root */}
      <Toaster theme="dark" richColors />

      {/* Load components only if the user is logged in */}
      {getToken() !== null && (
        <>
          <DialogManager />
          <MusicPlayer />
          <DragWindowRegion />
        </>
      )}

      <main className="h-screen w-screen">{children}</main>
    </div>
  )
}
