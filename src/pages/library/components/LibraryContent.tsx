import { useIsMobile } from '@/components/hooks/use-mobile'
import Grid from '@/components/ui/Grid'
import { Library } from '@/data/interfaces/Media'
import { useCardWidth } from '@/hooks/useCardWidth'
import AlbumList from './lists/AlbumList'
import MoviesList from './lists/MoviesList'
import SeriesList from './lists/SeriesList'

interface LibraryContentProps {
  library: Library
  mutateLibrary: () => void
}

function LibraryContent({ library, mutateLibrary }: LibraryContentProps) {
  const isMobile = useIsMobile()
  const { cardWidth } = useCardWidth()

  const ItemsList = () =>
    library.type === 'Music' ? (
      <AlbumList library={library} />
    ) : library.type === 'Shows' ? (
      <SeriesList library={library} mutateLibrary={mutateLibrary} />
    ) : (
      <MoviesList library={library} mutateLibrary={mutateLibrary} />
    )

  console.log('LibraryContent: ', library.id)

  return (
    <Grid
      columns={
        isMobile
          ? `repeat(auto-fit, minmax(${cardWidth * 0.8}px, 1fr))`
          : `repeat(auto-fit, minmax(${cardWidth * 0.8}px, ${cardWidth * 1.2}px))`
      }
      rows="0fr"
      gap="1rem"
      height="100%"
      padding={isMobile ? '1rem 1rem 5rem 1rem' : '2rem'}
      scroll="vertical"
      justifyContent="start"
      alignItems="start"
      hideScrollbar
    >
      <ItemsList />
    </Grid>
  )
}

export default LibraryContent
