import Image from '@/components/ui/Image'
import { useMusicStore } from '@seerial/stores'

function MusicPlayerCover() {
  const album = useMusicStore((state) => state.album)

  return (
    <div
      className={`flex h-full w-full items-center justify-center pt-20 pb-10 transition-all duration-500 ease-in-out`}
    >
      <div
        className={`relative max-h-[60dvh] w-full max-w-[60dvh] transition-all duration-500 ease-in-out`}
      >
        <Image
          url={album?.coverSrc ?? ''}
          alt={'Song Cover Image'}
          aspectRatio={1}
          className={`h-full w-full rounded-2xl object-cover shadow-2xl shadow-black/20`}
          fallbackSrc={'local/img/songDefault.png'}
        />
      </div>
    </div>
  )
}

export default MusicPlayerCover
