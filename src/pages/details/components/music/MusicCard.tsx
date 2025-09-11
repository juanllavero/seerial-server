import FlexBox from '@/components/ui/FlexBox'
import {
  DolbyAtmosIcon,
  PauseIcon,
  PlayIcon,
} from '@/components/ui/IconLibrary'
import useMusicStore from '@/context/music.context'
import { Song } from '@/data/interfaces/Music'
import { formatTime } from '@/utils/ReactUtils'
import { useState } from 'react'
import MusicWave from './MusicWave'
import { useIsMobile } from '@/components/hooks/use-mobile'
import { DotsVerticalIcon } from '@radix-ui/react-icons'
import { useIsTablet } from '@/components/hooks/use-tablet'
import { shallow } from 'zustand/shallow'
import SmallSpinner from '@/components/SideBar/loading/SmallSpinner'
import DropdownWrapper from '@/components/DropdownWrapper'
import { useTranslation } from 'react-i18next'
import { useDialogStore } from '@/context/dialog.context'
import { Button } from '@/components/ui/button'

interface MusicCardProps {
  index: number
  song: Song
  handlePlaySong: (song: Song) => void
}

function MusicCard({ index, song, handlePlaySong }: MusicCardProps) {
  const { t } = useTranslation()
  const { currentSong, isPlaying, isLoading, addToQueue } = useMusicStore(
    (state) => ({
      album: state.album,
      currentSong: state.currentSong,
      isPlaying: state.isPlaying,
      isLoading: state.isLoading,
      addToQueue: state.addSong,
    }),
    shallow,
  )
  const openEditSongDialog = useDialogStore((state) => state.openSongDialog)
  const [isHovered, setIsHovered] = useState(false)
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  const artists = song.artists.join(', ')

  return (
    <FlexBox
      key={index}
      className={`hover:bg-black/40 ${currentSong?.id === song.id ? '' : ''}`}
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
          <FlexBox
            justify="center"
            align="center"
            css={{ width: '2rem', cursor: 'pointer' }}
          >
            {isHovered ? (
              <div
                onClick={() => {
                  if (!isTablet) {
                    handlePlaySong(song)
                  }
                }}
              >
                {isLoading ? (
                  <SmallSpinner />
                ) : isPlaying && currentSong?.id === song.id ? (
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
        <FlexBox direction="column" gap={0.2}>
          <span
            className="font-semibold"
            style={{ color: currentSong === song ? 'var(--app-color)' : '' }}
          >
            {song.title}
          </span>
          <FlexBox gap={1} align="center" className="items-center">
            <span className="self-center text-sm text-gray-400">{artists}</span>
          </FlexBox>
        </FlexBox>
      </FlexBox>
      <div
        className="flex items-center space-x-2"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <span>{formatTime(song.duration)}</span>
        {!isMobile && !isTablet && (
          <div className="h-10 w-10">
            {isHovered && (
              <DropdownWrapper
                content={{
                  items: [
                    {
                      items: [
                        {
                          title: t('addToQueue'),
                          action: () => addToQueue(song),
                        },
                        {
                          title: t('editButton'),
                          action: () => openEditSongDialog(song),
                        },
                      ],
                    },
                  ],
                }}
                button={
                  <Button
                    variant={'ghost'}
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <DotsVerticalIcon className="h-6 w-6 cursor-pointer opacity-80 transition-opacity duration-150 ease-in-out hover:opacity-100" />
                  </Button>
                }
              />
            )}
          </div>
        )}
      </div>
    </FlexBox>
  )
}

export default MusicCard
