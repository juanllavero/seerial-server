import FlexBox from '../ui/FlexBox'
import { Skeleton } from '../ui/skeleton'

interface CardGridSkeletonProps {
  cards: number
  width: number
  aspectRatio: number
}

function CardGridSkeleton({
  cards,
  width,
  aspectRatio,
}: CardGridSkeletonProps) {
  const skeletons = Array.from({ length: cards }, (_, index) => (
    <Skeleton key={index} style={{ width, height: width * aspectRatio }} />
  ))

  return (
    <FlexBox
      gap={2}
      padding="2rem"
      width="100%"
      direction="row"
      wrap="wrap"
      scroll="vertical"
    >
      {skeletons}
    </FlexBox>
  )
}

export default CardGridSkeleton
