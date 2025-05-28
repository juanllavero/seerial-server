import FlexBox from '@/components/ui/FlexBox'
import { PlayIcon } from '@/components/ui/IconLibrary'
import LazyImage from '@/components/ui/LazyImage'
import useMusicStore from '@/context/music.context'
import { useServerStore } from '@/context/server.context'
import { formatTime } from '@/utils/ReactUtils'
import { fetcher } from '@/utils/utils'
import useSWR from 'swr'
import './NextSongs.css'

function NextSongs() {
  const { songQueue, currentSong, selectSong } = useMusicStore()
  const { selectedServer } = useServerStore()
  const { data: album } = useSWR(
    currentSong && selectedServer
      ? `https://${selectedServer.ip}/details/album?id=${currentSong.albumId}`
      : null,
    fetcher,
  )

  if (!album) return null

  return (
    <FlexBox
      direction="column"
      gap={1}
      scroll="vertical"
      height="58dvh"
      padding="0 0.5rem"
      width="100%"
    >
      {songQueue.map((item, index) => (
        <FlexBox
          key={index}
          className={`songItem ${currentSong?.id === item.id ? 'activeSong' : ''}`}
          justify="space-between"
          align="center"
          gap={1}
          padding="0.5rem"
          width={'100%'}
          css={{ borderRadius: '5px' }}
        >
          <FlexBox gap={1} align="center">
            <div className="imgContainer" onClick={() => selectSong(item)}>
              <LazyImage
                url={album.coverSrc}
                aspectRatio="1"
                height={'2.5rem'}
              />
              <div className="shadowImage">
                <PlayIcon />
              </div>
            </div>
            <FlexBox direction="column">
              <span>{item.title}</span>
              <span>{album.name}</span>
            </FlexBox>
          </FlexBox>
          <span>{formatTime(item.duration)}</span>
        </FlexBox>
      ))}
    </FlexBox>
  )
}

export default NextSongs
