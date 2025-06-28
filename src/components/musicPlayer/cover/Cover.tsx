import Image from '@/components/ui/Image'
import useMusicStore from '@/context/music.context'

function MusicPlayerCover() {
  const { album, isExpanded } = useMusicStore()

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
      >
        <Image
          url={album?.coverSrc ?? ''}
          alt={'Song Cover Image'}
          aspectRatio={1}
          width={isExpanded ? undefined : 80}
          height={isExpanded ? undefined : 80}
          className={`h-full w-full rounded-2xl object-cover shadow-xl shadow-black/20 transition-all duration-500 ease-in-out ${
            isExpanded ? 'shadow-2xl' : 'rounded-xl'
          }`}
          fallbackSrc={''}
        />

        {/* Gradient overlay for expanded mode */}
        {/* {isExpanded && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent" />
        )} */}
      </div>
    </div>
  )
}

export default MusicPlayerCover
