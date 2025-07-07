import Image from '@/components/ui/Image'
import { useServerStore } from '@/context/server.context'
import { Collection } from '@/data/interfaces/Media'
import { getFirstImage, getPosterImage } from '@/utils/ReactUtils'
import { fetcher } from '@/utils/utils'
import useSWR from 'swr'

interface CollectionImageProps {
  collection: Collection
  type: string
}

function CollectionImage({ collection, type }: CollectionImageProps) {
  const selectedServer = useServerStore((state) => state.selectedServer)
  const { data: collectionImages } = useSWR<string[]>(
    `https://${selectedServer?.ip}/collection-images?collectionId=${collection.id}&&type=${type}`,
    fetcher,
  )

  const posterImage = collection.coverSrc
    ? collection.coverSrc
    : getFirstImage(collection, type)

  const collage = getPosterImage(collection.id, collectionImages || [], type)
  if (collage) {
    return (
      <div className={`aspect-[${type == 'Music' ? '1' : '2/3'}] w-100`}>
        {collage}
      </div>
    )
  }

  return (
    <Image
      url={posterImage}
      width={100}
      aspectRatio={type === 'Music' ? 1 : 2 / 3}
      fallbackSrc={
        type === 'Music' ? '/img/songDefault.png' : '/img/fileNotFound.jpg'
      }
      alt={'Collection Image'}
    />
  )
}

export default CollectionImage
