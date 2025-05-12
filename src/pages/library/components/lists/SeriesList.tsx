import { Library } from '@/data/interfaces/Media'
import React from 'react'
import CollectionCard from '../cards/CollectionCard'
import SeriesCard from '../cards/SeriesCard'

interface SeriesListProps {
  library: Library
}

function SeriesList({ library }: SeriesListProps) {
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
      {library.series &&
        library.series.length > 0 &&
        library.series.map((series) => (
          <SeriesCard key={series.id} series={series} />
        ))}
    </>
  )
}

export default SeriesList
