import { Button } from '@/components/ui/button'
import Image from '@/components/ui/Image'
import { Maximize2 } from 'lucide-react'
import useMusicStore from '@/context/music.context'

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
  const { isPlaying } = useMusicStore()
  return (
    <div
      className={`transition-all duration-500 ease-in-out ${
        isExpanded
          ? `flex w-full items-center justify-center pt-20 pb-10`
          : 'mb-0 flex items-center space-x-4'
      }`}
    >
      <div
        className={`relative transition-all duration-500 ease-in-out ${
          isExpanded ? 'max-h-[60dvh] max-w-[60dvh]' : 'h-[5rem] w-[5rem]'
        }`}
        onMouseEnter={() => !isExpanded && setIsCoverHovered(true)}
        onMouseLeave={() => !isExpanded && setIsCoverHovered(false)}
      >
        <Image
          url={cover}
          alt={'Song Cover Image'}
          aspectRatio={1}
          width={isExpanded ? undefined : 80}
          height={isExpanded ? undefined : 80}
          className={`h-full w-full rounded-2xl object-cover shadow-lg transition-all duration-500 ease-in-out ${
            isExpanded ? 'shadow-2xl' : 'rounded-xl'
          }`}
          fallbackSrc={''}
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
