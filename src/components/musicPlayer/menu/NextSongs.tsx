import FlexBox from '@/components/ui/FlexBox'
import { PauseIcon, PlayIcon } from '@/components/ui/IconLibrary'
import LazyImage from '@/components/ui/LazyImage'
import useMusicStore from '@/context/music.context'
import { useServerStore } from '@/context/server.context'
import { formatTime } from '@/utils/ReactUtils'
import { fetcher } from '@/utils/utils'
import useSWR from 'swr'
import './NextSongs.css'
import { useTranslation } from 'react-i18next'
import { shallow } from 'zustand/shallow'
import SmallSpinner from '@/components/SideBar/loading/SmallSpinner'

function NextSongs() {
  const { t } = useTranslation()
  const {
    songQueue,
    currentSong,
    selectSong,
    isPlaying,
    isLoading,
    togglePlayPause,
  } = useMusicStore(
    (state) => ({
      songQueue: state.songQueue,
      currentSong: state.currentSong,
      selectSong: state.selectSong,
      isPlaying: state.isPlaying,
      isLoading: state.isLoading,
      togglePlayPause: state.togglePlayPause,
    }),
    shallow,
  )
  const serverUrl = useServerStore((state) => state.serverUrl)
  const { data: album } = useSWR(
    currentSong && serverUrl !== ''
      ? `${serverUrl}/details/album?id=${currentSong.albumId}`
      : null,
    fetcher,
  )

  if (!album) return null

  return (
    <FlexBox
      direction="column"
      gap={1}
      scroll="vertical"
      width={'100%'}
      height="100%"
      padding="0 0.5rem"
      className="overflow-x-hidden rounded-lg bg-black"
    >
      <span className="p-2 pb-0 text-2xl font-black">{t('queue')}</span>
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
            <div
              className="imgContainer"
              onClick={() => {
                if (currentSong === item) {
                  togglePlayPause()
                } else {
                  selectSong(item)
                }
              }}
            >
              <LazyImage
                url={album.coverSrc}
                aspectRatio="1"
                height={'2.5rem'}
              />
              <div className="shadowImage">
                {isLoading ? (
                  <SmallSpinner />
                ) : isPlaying ? (
                  <PauseIcon />
                ) : (
                  <PlayIcon />
                )}
              </div>
            </div>
            <FlexBox direction="column">
              <span className="truncate">{item.title}</span>
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
