import { LibraryTypes } from '@/data/enums/LibraryTypes'
import { useCardWidth } from '@/hooks/useCardWidth'
import { useIsMobile } from '../hooks/use-mobile'
import FlexBox from '../ui/FlexBox'
import Grid from '../ui/Grid'
import { Skeleton } from '../ui/skeleton'
import './CardGridSkeleton.css'

interface CardGridSkeletonProps {
  cards: number
  type: string
  width?: number
}

function CardGridSkeleton({ cards, type, width }: CardGridSkeletonProps) {
  const isMobile = useIsMobile()
  const { cardWidth } = useCardWidth()

  const finalWidth = width ?? cardWidth
  const isMusic = type === LibraryTypes.MUSIC

  // Configuración del grid según el dispositivo
  const getGridColumns = () => {
    if (isMobile) return 'repeat(2, 1fr)' // 2 columnas de igual ancho en móvil
    return `repeat(auto-fit, minmax(${finalWidth * 0.8}px, ${finalWidth * 1.2}px))`
  }

  const skeletons = Array.from({ length: cards }, (_, index) => (
    <FlexBox
      direction="column"
      justify="center"
      gap={1}
      width="100%"
      key={'CarGrid Card ' + index}
      css={{
        border: '2px solid transparent',
        height: '100%',
      }}
    >
      <div
        style={{
          width: '100%',
          aspectRatio: isMusic ? '1/1' : '2/3', // Mantener aspect ratio
        }}
      >
        <Skeleton
          style={{
            width: '100%',
            height: '100%', // Ocupa todo el contenedor padre
          }}
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

  return (
    <Grid
      columns={getGridColumns()}
      gap={isMobile ? '0.5rem' : '1rem'}
      padding={isMobile ? '1rem' : '2rem'}
      scroll="vertical"
      justifyContent="start"
      alignItems="start"
      className="card-skeleton-animate"
      css={{
        animationDelay: `100ms`,
      }}
      hideScrollbar
    >
      {skeletons}
    </Grid>
  )
}

export default CardGridSkeleton
