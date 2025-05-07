import Loading from '@/components/Loading'
import { useServerStore } from '@/context/server.context'
import { Collection } from '@/data/interfaces/Media'
import { Album } from '@/data/interfaces/Music'
import { fetcher } from '@/utils/utils'
import React from 'react'
import useSWR from 'swr'
import AlbumCard from '../cards/AlbumCard'
import CollectionCard from '../cards/CollectionCard'

interface AlbumListProps {
  libraryId: string
}

function AlbumList({ libraryId }: AlbumListProps) {
  const { serverIP } = useServerStore()
  const { data: albumList, isLoading: loadingMovies } = useSWR<Album[]>(
    libraryId ? `http://${serverIP}/albums?libraryId=${libraryId}` : null,
    fetcher,
  )
  const { data: collectionList, isLoading: loadingCollections } = useSWR<
    Collection[]
  >(
    libraryId ? `http://${serverIP}/collections?libraryId=${libraryId}` : null,
    fetcher,
  )

  if (loadingCollections || loadingMovies) {
    return <Loading />
  }

  return (
    <>
      {collectionList?.map((collection) => (
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
