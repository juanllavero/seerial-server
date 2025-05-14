import FlexBox from '@/components/ui/FlexBox'
import { PlayIcon } from '@/components/ui/IconLibrary'
import useMusicStore from '@/context/music.context'
import { Song } from '@/data/interfaces/Music'
import { formatTime } from '@/utils/ReactUtils'
import React from 'react'
import './MusicCard.css'

interface MusicCardProps {
  index: number
  song: Song
  action: () => void
}

function MusicCard({ index, song, action }: MusicCardProps) {
  const { currentSong, selectSong, setMusicPlayerShown, setSongQueue } =
    useMusicStore()

  return (
    <FlexBox
      key={index}
      className={`songItem ${currentSong?.id === song.id ? 'activeSong' : ''}`}
      justify="space-between"
      align="center"
      gap={1}
      padding="0.8rem 0.5rem"
      width={'100%'}
      css={{ borderRadius: '5px', maxWidth: '1500px' }}
      onClick={action}
    >
      <FlexBox gap={1} align="center">
        <FlexBox
          className="songNumberAndButton"
          justify="center"
          align="center"
          css={{ width: '2rem' }}
        >
          <div id="index">
            <span>{index + 1}</span>
          </div>
          <div className="playButtonContainer">
            <PlayIcon />
          </div>
        </FlexBox>
        <span>{song.title}</span>
      </FlexBox>
      <span>{formatTime(song.duration)}</span>
    </FlexBox>
  )
}

export default MusicCard
