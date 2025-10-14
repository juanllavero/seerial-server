import { useGradientStore } from '@/context/gradientBackground.context'
import useMusicStore from '@/context/music.context'
import { Album } from '@/data/interfaces/Music'
import { authenticatedFetcher } from '@/lib/auth'
import { memo, useEffect, useRef } from 'react'
import useSWR from 'swr'
import { shallow } from 'zustand/shallow'

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
  const localAudioRef = useRef<HTMLAudioElement>(null)

  // Get Album details
  const { data: album } = useSWR<Album>(
    currentSong && currentSong.albumId
      ? `/api/details/album?id=${currentSong.albumId}`
      : null,
    authenticatedFetcher,
  )

  useEffect(() => {
    if (localAudioRef.current) {
      const cleanup = initializeAudioRef(localAudioRef)

      return cleanup
    }
  }, [currentSong, initializeAudioRef])

  // Handle gradient background
  useEffect(() => {
    if (album) {
      setAlbum(album)
      generateGradient(album.coverSrc, true)
    }
  }, [album])

  if (!album || !currentSong) return null

  return (
    <audio
      ref={localAudioRef}
      src={`/api/${getAudioSrc()}`}
      onError={(e) => console.error('Audio loading error:', e)}
      autoPlay
    />
  )
}

export default memo(MusicPlayer)
