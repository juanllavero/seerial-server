import useMusicStore from '@/context/music.context'
import React from 'react'
import FlexBox from '../ui/FlexBox'
import LazyImage from '../ui/LazyImage'

function CoverImage({ isMobile }: { isMobile: boolean }) {
  const { currentSong } = useMusicStore()

  console.log('currentSong:', currentSong)

  return (
    <FlexBox
      padding="2rem"
      height={'80%'}
      width={'60%'}
      align="center"
      justify="center"
    >
      <LazyImage
        url={currentSong?.album.coverSrc}
        alt={currentSong?.song.name}
        width={'auto'}
        height={'80%'}
        aspectRatio={'1'}
        maxHeight={isMobile ? 100 : 700}
        errorSrc="/img/songDefault.png"
      />
    </FlexBox>
  )
}

export default CoverImage
