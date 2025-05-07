import Loading from '@/components/Loading'
import { useServerStore } from '@/context/server.context'
import { Collection, Series } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import React from 'react'
import useSWR from 'swr'
import CollectionCard from '../cards/CollectionCard'
import SeriesCard from '../cards/SeriesCard'

interface SeriesListProps {
  libraryId: string
}

function SeriesList({ libraryId }: SeriesListProps) {
  const { serverIP } = useServerStore()
  const { data: seriesList, isLoading: loadingSeries } = useSWR<Series[]>(
    libraryId ? `http://${serverIP}/series?libraryId=${libraryId}` : null,
    fetcher,
  )
  const { data: collectionList, isLoading: loadingCollections } = useSWR<
    Collection[]
  >(
    libraryId ? `http://${serverIP}/collections?libraryId=${libraryId}` : null,
    fetcher,
  )

  if (loadingCollections || loadingSeries) {
    return <Loading />
  }

  return (
    <>
      {collectionList?.map((collection) => (
        <CollectionCard
          key={collection.id}
          collection={collection}
          type={'Shows'}
        />
      ))}
      {seriesList?.map((series) => (
        <SeriesCard key={series.id} series={series} />
      ))}
    </>
  )
}

export default SeriesList
