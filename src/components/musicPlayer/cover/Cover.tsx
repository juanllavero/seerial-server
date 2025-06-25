import { Button } from '@/components/ui/button'
import { Maximize2 } from 'lucide-react'
import Image from '@/components/ui/Image'

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
  return (
    <div
      className={`transition-all duration-500 ease-in-out ${
        isExpanded
          ? 'flex w-3/5 items-center justify-center'
          : 'mb-0 flex items-center space-x-4'
      }`}
    >
      <div
        className={`relative transition-all duration-500 ease-in-out ${isExpanded ? '' : ''}`}
        onMouseEnter={() => !isExpanded && setIsCoverHovered(true)}
        onMouseLeave={() => !isExpanded && setIsCoverHovered(false)}
      >
        <Image
          url={cover}
          alt={'Song Cover Image'}
          className={`shadow-lg transition-all duration-500 ease-in-out ${
            isExpanded
              ? 'h-96 w-96 rounded-2xl shadow-2xl'
              : 'h-18 w-18 rounded-xl'
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
