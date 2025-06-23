import CardGridSkeleton from '@/components/skeletons/CardGridSkeleton'

interface LibraryPageSkeletonProps {
  cardWidth: number
  type: string
}

function LibraryPageSkeleton({ cardWidth, type }: LibraryPageSkeletonProps) {
  return <CardGridSkeleton cards={20} width={cardWidth} type={type} />
}

export default LibraryPageSkeleton
