import { useIsMobile } from '@/components/hooks/use-mobile'
import FlexBox from '@/components/ui/FlexBox'
import { Skeleton } from '@/components/ui/skeleton'

interface HorizontalListSkeletonProps {
  listType: string
}

function HorizontalListSkeleton({ listType }: HorizontalListSkeletonProps) {
  const isMobile = useIsMobile()
  const skeletons = Array.from({ length: 20 }, (_, index) => (
    <FlexBox
      direction="column"
      justify="center"
      gap={1}
      width="100%"
      key={listType + ' Card ' + index}
      css={{
        border: '2px solid transparent',
        height: '100%',
      }}
    >
      <div
        style={{
          width: '100%',
          aspectRatio: '2/3',
        }}
      >
        <Skeleton
          key={'MyListMovies ' + index}
          className={isMobile ? 'h-48.75 min-w-32.5' : 'h-67.5 min-w-45'}
        />
      </div>
      <div
        className="grid gap-3 p-1"
        style={{
          width: '100%',
          textAlign: 'left',
          justifyItems: 'start',
          alignItems: 'start',
          minWidth: 0,
        }}
      >
        <a>
          <Skeleton className="h-4 w-30" />
        </a>
        <span>
          <Skeleton className="h-3 w-10" />
        </span>
      </div>
    </FlexBox>
  ))

  return <>{skeletons}</>
}

export default HorizontalListSkeleton
