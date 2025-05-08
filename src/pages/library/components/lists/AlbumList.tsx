import Loading from '@/components/Loading'
import { useServerStore } from '@/context/server.context'
import { Library } from '@/data/interfaces/Media'
import { Album } from '@/data/interfaces/Music'
import { fetcher } from '@/utils/utils'
import React from 'react'
import useSWR from 'swr'
import AlbumCard from '../cards/AlbumCard'
import CollectionCard from '../cards/CollectionCard'

interface AlbumListProps {
  library: Library
}

function AlbumList({ library }: AlbumListProps) {
  const { serverIP } = useServerStore()
  const { data: albumList, isLoading: loadingAlbums } = useSWR<Album[]>(
    library ? `http://${serverIP}/albums?libraryId=${library.id}` : null,
    fetcher,
  )

  if (loadingAlbums) {
    return <Loading />
  }

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
      {albumList?.map((album) => <AlbumCard key={album.id} album={album} />)}
    </>
  )
}

export default AlbumList
