import { useCardWidth } from '@/hooks/useCardWidth'
import { useIsMobile } from '../hooks/use-mobile'
import { useIsTablet } from '../hooks/use-tablet'
import FlexBox from '../ui/FlexBox'
import Grid from '../ui/Grid'
import { Skeleton } from '../ui/skeleton'

interface CardGridSkeletonProps {
  cards: number
  width: number | string
}

function CardGridSkeleton({ cards, width }: CardGridSkeletonProps) {
  const isTablet = useIsTablet()
  const isMobile = useIsMobile()
  const { cardWidth } = useCardWidth()
  const skeletons = Array.from({ length: cards }, (_, index) => (
    <FlexBox
      direction="column"
      justify="center"
      gap={0.1}
      width={width}
      key={'CarGrid Card ' + index}
    >
      <div>
        <Skeleton
          key={index}
          style={{
            width: isMobile || isTablet ? '100%' : cardWidth * 1.2,
            minWidth: '210px',
            height: `${cardWidth * (16 / 9)}px`,
            minHeight: '340px',
          }}
        />
      </div>
      <div
        className="grid gap-1 p-2"
        style={{
          width: width,
          textAlign: 'left',
          justifyItems: 'start',
          alignItems: 'start',
          minWidth: 0,
        }}
      >
        <a>
          <Skeleton className="h-3 w-30" />
        </a>

        <span>
          <Skeleton className="h-3 w-10" />
        </span>
      </div>
    </FlexBox>
  ))

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
