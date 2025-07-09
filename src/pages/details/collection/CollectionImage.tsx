import useScreenHeight from '@/components/hooks/use-height'
import { useIsMobile } from '@/components/hooks/use-mobile'
import Image from '@/components/ui/Image'
import { useServerStore } from '@/context/server.context'
import { Collection } from '@/data/interfaces/Media'
import { getCoverSize, getFirstImage, getPosterImage } from '@/utils/ReactUtils'
import { fetcher } from '@/utils/utils'
import useSWR from 'swr'

interface CollectionImageProps {
  collection: Collection
  type: string
}

function CollectionImage({ collection, type }: CollectionImageProps) {
  const serverIP = useServerStore((state) => state.serverIP)
  const screenHeight = useScreenHeight()
  const isMobile = useIsMobile()
  const { data: collectionImages } = useSWR<string[]>(
    `http://${serverIP}/collection-images?collectionId=${collection.id}&&type=${type}`,
    fetcher,
  )

  const posterImage = collection.coverSrc
    ? collection.coverSrc
    : getFirstImage(collection, type)

  const collage = getPosterImage(collection.id, collectionImages || [], type)
  if (collage) {
    return (
      <div
        className={`${!isMobile ? getCoverSize(screenHeight, type !== 'Music', false) : `h-screen ${type === 'Music' ? 'max-h-[55dvw]' : 'max-h-[80dvw]'} w-screen max-w-[55dvw]`}`}
      >
        {collage}
      </div>
    )
  }

  return (
    <div
      className={`${!isMobile ? getCoverSize(screenHeight, type !== 'Music', false) : `h-screen ${type === 'Music' ? 'max-h-[55dvw]' : 'max-h-[80dvw]'} w-screen max-w-[55dvw]`}`}
    >
      <Image
        url={posterImage}
        aspectRatio={type === 'Music' ? 1 : 2 / 3}
        fallbackSrc={
          type === 'Music' ? '/img/songDefault.png' : '/img/fileNotFound.jpg'
        }
        alt={'Collection Image'}
      />
    </div>
  )
}

export default CollectionImage
