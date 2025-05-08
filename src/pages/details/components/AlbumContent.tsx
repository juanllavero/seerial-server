import { useIsMobile } from '@/components/hooks/use-mobile'
import FlexBox from '@/components/ui/FlexBox'
import { Album } from '@/data/interfaces/Music'
import React from 'react'
import SongsList from './music/SongsList'

interface AlbumContentProps {
  album: Album
}

function AlbumContent({ album }: AlbumContentProps) {
  const isMobile = useIsMobile()

  return (
    <FlexBox
      direction="column"
      gap={2}
      margin="1rem 0 0 0"
      padding={isMobile ? '1rem 2rem' : '0'}
      width={'100%'}
    >
      <SongsList album={album} />
    </FlexBox>
  )
}

export default AlbumContent
