import { useIsMobile } from '../hooks/use-mobile'
import { useIsTablet } from '../hooks/use-tablet'
import FlexBox from '../ui/FlexBox'
import Grid from '../ui/Grid'
import { Skeleton } from '../ui/skeleton'

interface CardGridSkeletonProps {
  cards: number
  width: number | string
  aspectRatio: number
}

function CardGridSkeleton({
  cards,
  width,
  aspectRatio,
}: CardGridSkeletonProps) {
  const isTablet = useIsTablet()
  const isMobile = useIsMobile()
  const skeletons = Array.from({ length: cards }, (_, index) => (
    <Skeleton
      key={index}
      style={{ width: isMobile || isTablet ? '100%' : width, height: 'auto' }}
    />
  ))

  const getCardWidth = () => {
    const savedWidth = localStorage.getItem('cardWidth')
    const baseWidth = savedWidth ? Number(savedWidth) * 0.8 : 160

    // Adjust according to the device
    if (isMobile) return Math.max(baseWidth * 0.8, 120) // Minimum 120px on mobile
    if (isTablet) return Math.max(baseWidth * 0.9, 150) // Minimum 150px on tablet
    return Math.max(baseWidth, 180) // Minimum 180px on desktop
  }

  const cardWidth = getCardWidth()

  return (
    <Grid
      columns={
        isMobile || isTablet
          ? `repeat(auto-fit, minmax(${cardWidth}px, 1fr))`
          : `repeat(auto-fit, minmax(${cardWidth * 0.8}px, ${cardWidth * 1.2}px))`
      }
      gap="1rem"
      padding={isMobile ? '1rem' : '2rem'}
      scroll="vertical"
      justifyContent="start"
      alignItems="start"
      hideScrollbar
    >
      {skeletons}
    </Grid>
  )
}

export default CardGridSkeleton
