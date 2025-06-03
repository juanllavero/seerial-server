import CardGridSkeleton from '@/components/skeletons/CardGridSkeleton'

interface LibraryPageSkeletonProps {
  cardWidth: number
}

function LibraryPageSkeleton({ cardWidth }: LibraryPageSkeletonProps) {
  return <CardGridSkeleton cards={12} width={cardWidth} aspectRatio={3 / 2} />
}

export default LibraryPageSkeleton
