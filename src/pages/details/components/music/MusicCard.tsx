import FlexBox from '@/components/ui/FlexBox'
import { PauseIcon, PlayIcon } from '@/components/ui/IconLibrary'
import useMusicStore from '@/context/music.context'
import { Song } from '@/data/interfaces/Music'
import { formatTime } from '@/utils/ReactUtils'
import { useState } from 'react'
import './MusicCard.css'
import MusicWave from './MusicWave'
import { useIsMobile } from '@/components/hooks/use-mobile'
import { DotsVerticalIcon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'
import { useIsTablet } from '@/components/hooks/use-tablet'
import { shallow } from 'zustand/shallow'

interface MusicCardProps {
  index: number
  song: Song
  handlePlaySong: (song: Song) => void
}

function MusicCard({ index, song, handlePlaySong }: MusicCardProps) {
  const { currentSong, isPlaying } = useMusicStore(
    (state) => ({
      currentSong: state.currentSong,
      isPlaying: state.isPlaying,
    }),
    shallow,
  )
  const [isHovered, setIsHovered] = useState(false)
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  return (
    <FlexBox
      key={index}
      className={`hover:bg-[#2b2b2b] ${currentSong?.id === song.id ? '' : ''}`}
      justify="space-between"
      align="center"
      gap={1}
      padding="1rem 0.8rem"
      width={'100%'}
      css={{ borderRadius: '5px', maxWidth: '1200px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (isMobile || isTablet) {
          handlePlaySong(song)
        }
      }}
    >
      <FlexBox gap={1} align="center">
        {!isMobile && (
          <FlexBox justify="center" align="center" css={{ width: '2rem' }}>
            {isHovered ? (
              <div
                onClick={() => {
                  if (!isTablet) {
                    handlePlaySong(song)
                  }
                }}
              >
                {isPlaying && currentSong?.id === song.id ? (
                  <PauseIcon size={20} />
                ) : (
                  <PlayIcon size={20} />
                )}
              </div>
            ) : currentSong === song && isPlaying ? (
              <MusicWave />
            ) : (
              <span
                style={{
                  color:
                    currentSong === song ? 'var(--app-color)' : 'lightgray',
                }}
              >
                {index + 1}
              </span>
            )}
          </FlexBox>
        )}
        <span
          className="font-semibold"
          style={{ color: currentSong === song ? 'var(--app-color)' : '' }}
        >
          {song.title}
        </span>
      </FlexBox>
      <div className="flex items-center space-x-2">
        <span>{formatTime(song.duration * 60)}</span>
        {!isMobile && !isTablet && (
          <div className="h-10 w-10">
            {isHovered && (
              <DotsVerticalIcon className="h-6 w-6 cursor-pointer opacity-80 transition-opacity duration-150 ease-in-out hover:opacity-100" />
            )}
          </div>
        )}
      </div>
    </FlexBox>
  )
}

export default MusicCard
