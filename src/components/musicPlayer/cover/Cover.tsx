import { useIsMobile } from '@/components/hooks/use-mobile'
import { useIsTablet } from '@/components/hooks/use-tablet'
import { Button } from '@/components/ui/button'
import Image from '@/components/ui/Image'
import { Maximize2 } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface MusicPlayerCoverProps {
  cover: string
  title: string
  subtitle: string
  isExpanded: boolean
  handleMinimize: () => void
  handleExpand: () => void
  isCoverHovered: boolean
  setIsCoverHovered: (isCoverHovered: boolean) => void
}

function MusicPlayerCover({
  cover,
  title,
  subtitle,
  isExpanded,
  handleExpand,
  isCoverHovered,
  setIsCoverHovered,
}: MusicPlayerCoverProps) {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const imgRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const adjustImageSize = () => {
    if (containerRef.current && imgRef.current) {
      if (!isExpanded) {
        imgRef.current.style.width = '5rem'
        imgRef.current.style.height = '5rem'
      } else {
        const parentWidth = containerRef.current.offsetWidth
        const parentHeight = containerRef.current.offsetHeight
        const minDimension = Math.min(parentWidth, parentHeight)
        const imageSize = minDimension * 0.7

        imgRef.current.style.width = `${imageSize}px`
        imgRef.current.style.height = `${imageSize}px`
      }
    }
  }

  useEffect(() => {
    adjustImageSize()
    window.addEventListener('resize', adjustImageSize)
    return () => window.removeEventListener('resize', adjustImageSize)
  }, [isExpanded])

  return (
    <div
      ref={containerRef}
      className={`transition-all duration-500 ease-in-out ${
        isExpanded
          ? `flex items-center justify-center p-10 ${isTablet ? 'h-[50dvh] max-h-[50dvh] w-[50dvh]' : isMobile ? 'h-[20dvh] max-h-[20dvh] w-full' : 'w-3/5'}`
          : 'mb-0 flex items-center space-x-4'
      }`}
    >
      <div
        ref={imgRef}
        className={`relative transition-all duration-500 ease-in-out`}
        onMouseEnter={() => !isExpanded && setIsCoverHovered(true)}
        onMouseLeave={() => !isExpanded && setIsCoverHovered(false)}
      >
        <Image
          url={cover}
          alt={'Song Cover Image'}
          className={`shadow-lg transition-all duration-500 ease-in-out ${
            isExpanded
              ? 'h-full w-full rounded-2xl shadow-2xl'
              : 'h-[5rem] w-[5rem] rounded-xl'
          }`}
          fallbackSrc={''}
          aspectRatio={1}
        />

        {/* Maximize button - Compact Mode */}
        {isCoverHovered && !isExpanded && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 transition-all duration-200">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExpand}
              className="text-white hover:bg-white/20"
            >
              <Maximize2 className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Gradient overlay for expanded mode */}
        {isExpanded && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent" />
        )}
      </div>

      {/* Song info - Compact Mode */}
      <div
        className={`min-w-0 flex-1 transition-all duration-500 ${
          isExpanded
            ? 'pointer-events-none absolute opacity-0 transition-none'
            : 'opacity-100'
        }`}
      >
        <h3 className="truncate font-semibold text-white text-shadow-lg">
          {title}
        </h3>
        <p className="truncate text-sm text-white text-shadow-lg">{subtitle}</p>
      </div>
    </div>
  )
}

export default MusicPlayerCover
