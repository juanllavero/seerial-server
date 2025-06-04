import { useIsMobile } from '@/components/hooks/use-mobile'
import FlexBox from '@/components/ui/FlexBox'
import LazyImage from '@/components/ui/LazyImage'
import { Cast } from '@/data/interfaces/Media'

interface CastCardProps {
  index: string | number
  person: Cast
}

function CastCard({ index, person }: CastCardProps) {
  const isMobile = useIsMobile()
  return (
    <FlexBox
      direction="column"
      gap={0.5}
      justify="center"
      align="center"
      className="text-center"
      key={'Cast Person ' + index}
      padding="1rem"
    >
      <LazyImage
        src={person.profileImage}
        width={isMobile ? 80 : 120}
        height={isMobile ? 80 : 120}
        className="rounded-full"
        rounded
        alt={person.name}
      />
      <span className={isMobile ? 'text-xs' : ''}>{person.name}</span>
      <span
        className={isMobile ? 'text-xs' : 'text-sm'}
        style={{ color: 'lightgray' }}
      >
        {person.character}
      </span>
    </FlexBox>
  )
}

export default CastCard
