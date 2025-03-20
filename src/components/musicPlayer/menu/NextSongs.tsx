import FlexBox from '@/components/ui/FlexBox'
import { PlayIcon } from '@/components/ui/IconLibrary'
import LazyImage from '@/components/ui/LazyImage'
import useMusicStore from '@/context/music.context'
import { formatTime } from '@/utils/ReactUtils'
import React from 'react'
import './NextSongs.css'

function NextSongs() {
  const { songQueue, currentSong, selectSong } = useMusicStore()

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
          className={`songItem ${currentSong?.song.id === item.song.id ? 'activeSong' : ''}`}
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
                url={item.song.imgSrc}
                width={'2.5rem'}
                height={'2.5rem'}
              />
              <div className="shadowImage">
                <PlayIcon />
              </div>
            </div>
            <FlexBox direction="column">
              <span>{item.song.name}</span>
              <span>{item.collection.name}</span>
            </FlexBox>
          </FlexBox>
          <span>{formatTime(item.song.runtimeInSeconds)}</span>
        </FlexBox>
      ))}
    </FlexBox>
  )
}

export default NextSongs
