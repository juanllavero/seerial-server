import Loading from '@/components/Loading'
import { useServerStore } from '@/context/server.context'
import { Library, Series } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import React from 'react'
import useSWR from 'swr'
import CollectionCard from '../cards/CollectionCard'
import SeriesCard from '../cards/SeriesCard'

interface SeriesListProps {
  library: Library
}

function SeriesList({ library }: SeriesListProps) {
  const { serverIP } = useServerStore()
  const { data: seriesList, isLoading: loadingSeries } = useSWR<Series[]>(
    library ? `http://${serverIP}/series?libraryId=${library.id}` : null,
    fetcher,
  )

  if (loadingSeries) {
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
