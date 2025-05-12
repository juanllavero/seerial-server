import { Library } from '@/data/interfaces/Media'
import React from 'react'
import AlbumCard from '../cards/AlbumCard'
import CollectionCard from '../cards/CollectionCard'

interface AlbumListProps {
  library: Library
}

function AlbumList({ library }: AlbumListProps) {
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
      {library.albums &&
        library.albums.length > 0 &&
        library.albums.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
    </>
  )
}

export default AlbumList
