import FlexBox from '@/components/ui/FlexBox'
import { Album } from '@/data/interfaces/Music'
import SongsList from './music/SongsList'
import { useIsMobile } from '@/components/hooks/use-mobile'
import { useIsTablet } from '@/components/hooks/use-tablet'

interface AlbumContentProps {
  album: Album
}

function AlbumContent({ album }: AlbumContentProps) {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  return (
    <FlexBox
      direction="column"
      className="flex-1"
      gap={1}
      scroll={!isMobile && !isTablet ? 'vertical' : undefined}
      justify="start"
      align="start"
      margin="1rem 0 0 0"
      padding={isMobile ? '0 1rem 4rem 1rem' : '0 1.5rem 4rem 1.5rem'}
      height={!isMobile && !isTablet ? '100%' : 'auto'}
      width={'100%'}
    >
      <SongsList album={album} />
    </FlexBox>
  )
}

export default AlbumContent
