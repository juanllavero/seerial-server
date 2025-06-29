import { useEffect, useRef } from 'react'
import { useServerStore } from '@/context/server.context'
import { Album } from '@/data/interfaces/Music'
import { ReactUtils } from '@/utils/ReactUtils'
import { fetcher } from '@/utils/utils'
import useSWR from 'swr'
import { memo } from 'react'
import useMusicStore from '@/context/music.context'

function MusicPlayer() {
  const { currentSong, initializeAudioRef, getAudioSrc, setAlbum } =
    useMusicStore()
  const { selectedServer } = useServerStore()
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
      ReactUtils.generateGradient(album.coverSrc, selectedServer.ip, true)
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
