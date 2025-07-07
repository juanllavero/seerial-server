import { useEffect, useRef } from 'react'
import { useServerStore } from '@/context/server.context'
import { Album } from '@/data/interfaces/Music'
import { fetcher } from '@/utils/utils'
import useSWR from 'swr'
import { memo } from 'react'
import useMusicStore from '@/context/music.context'
import { shallow } from 'zustand/shallow'
import { useGradientStore } from '@/context/gradientBackground.context'

function MusicPlayer() {
  const { currentSong, initializeAudioRef, getAudioSrc, setAlbum } =
    useMusicStore(
      (state) => ({
        currentSong: state.currentSong,
        initializeAudioRef: state.initializeAudioRef,
        getAudioSrc: state.getAudioSrc,
        setAlbum: state.setAlbum,
      }),
      shallow,
    )
  const generateGradient = useGradientStore((state) => state.generateGradient)
  const selectedServer = useServerStore((state) => state.selectedServer)
  const localAudioRef = useRef<HTMLAudioElement>(null)

  // Get Album details
  const { data: album } = useSWR<Album>(
    currentSong && currentSong.albumId && selectedServer
      ? `https://${selectedServer.ip}/details/album?id=${currentSong.albumId}`
      : null,
    fetcher,
  )

  useEffect(() => {
    if (localAudioRef.current) {
      const cleanup = initializeAudioRef(localAudioRef)

      return cleanup
    }
  }, [currentSong, initializeAudioRef])

  // Handle gradient background
  useEffect(() => {
    if (album && selectedServer) {
      setAlbum(album)
      generateGradient(album.coverSrc, selectedServer.ip, true)
    }
  }, [album, selectedServer])

  if (!album || !currentSong) return null

  return (
    <audio
      ref={localAudioRef}
      src={`https://${selectedServer?.ip}${getAudioSrc()}`}
      onError={(e) => console.error('Audio loading error:', e)}
      autoPlay
    />
  )
}

export default memo(MusicPlayer)
