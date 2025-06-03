import { Library, Collection } from '@/data/interfaces/Media'
import AlbumCard from '../cards/AlbumCard'
import CollectionCard from '../cards/CollectionCard'
import { Album } from '@/data/interfaces/Music'

interface AlbumListProps {
  library: Library
}

function AlbumList({ library }: AlbumListProps) {
  // Get all album IDs that are in any collection
  const collectionAlbumIds = new Set(
    (library.collections || []).flatMap((collection: Collection) =>
      (collection.albums || []).map((album: Album) => album.id),
    ),
  )

  // Filter albums to only include those not in any collection
  const standaloneAlbums = (library.albums || []).filter(
    (album: Album) => !collectionAlbumIds.has(album.id),
  )

  return (
    <>
      {library.collections &&
        library.collections.length > 0 &&
        library.collections.map((collection) => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            type={'Music'}
          />
        ))}
      {standaloneAlbums.length > 0 &&
        standaloneAlbums.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
    </>
  )
}

export default AlbumList
