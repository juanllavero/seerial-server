import useMusicStore from '@/context/music.context'
import { useServerStore } from '@/context/server.context'
import { fetcher } from '@/utils/utils'
import React from 'react'
import useSWR from 'swr'
import FlexBox from '../ui/FlexBox'
import LazyImage from '../ui/LazyImage'

function CoverImage({ isMobile }: { isMobile: boolean }) {
  const { currentSong } = useMusicStore()
  const { serverIP } = useServerStore()
  const { data: album } = useSWR(
    currentSong
      ? `https://${serverIP}/details/album?id=${currentSong.albumId}`
      : null,
    fetcher,
  )

  if (!album) return null

  return (
    <FlexBox
      padding="2rem"
      height={'80%'}
      width={'60%'}
      align="center"
      justify="center"
    >
      <LazyImage
        url={album.coverSrc}
        alt={currentSong?.title}
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
