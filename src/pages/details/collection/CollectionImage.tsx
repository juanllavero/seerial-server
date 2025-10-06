import useScreenHeight from '@/components/hooks/use-height'
import { useIsMobile } from '@/components/hooks/use-mobile'
import Image from '@/components/ui/Image'
import { useServerStore } from '@/context/server.context'
import { Collection, CollectionImages } from '@/data/interfaces/Media'
import { authenticatedFetcher } from '@/lib/auth'
import { getCoverSize, getFirstImage, getPosterImage } from '@/utils/ReactUtils'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

interface CollectionImageProps {
  collection: Collection
  type: string
}

function CollectionImage({ collection, type }: CollectionImageProps) {
  const serverUrl = useServerStore((state) => state.serverUrl)
  const screenHeight = useScreenHeight()
  const isMobile = useIsMobile()
  const [posterImage, setPosterImage] = useState<string>('')
  const { data: collectionImages } = useSWR<CollectionImages>(
    `${serverUrl}/collection-images?collectionId=${collection.id}&&type=${type}`,
    authenticatedFetcher,
  )

  useEffect(() => {
    if (collectionImages) {
      setPosterImage(
        collection.coverSrc && collection.coverSrc !== ''
          ? collection.coverSrc
          : collectionImages.poster && collectionImages.poster !== ''
            ? collectionImages.poster
            : getFirstImage(collection, type),
      )
    }
  }, [collectionImages])

  if (
    collectionImages &&
    collectionImages.images &&
    collectionImages.images.length > 1
  ) {
    return (
      <div
        className={`${!isMobile ? getCoverSize(screenHeight, type !== 'Music', false) : `h-screen ${type === 'Music' ? 'max-h-[55dvw]' : 'max-h-[80dvw]'} w-screen max-w-[55dvw]`}`}
      >
        {getPosterImage(collection.id, collectionImages.images ?? [], type)}
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
