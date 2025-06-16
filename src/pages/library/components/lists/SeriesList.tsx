import { Collection, Library, Series } from '@/data/interfaces/Media'
import CollectionCard from '../cards/CollectionCard'
import SeriesCard from '../cards/SeriesCard'

interface SeriesListProps {
  library: Library
  mutateLibrary: () => void
}

function SeriesList({ library, mutateLibrary }: SeriesListProps) {
  // Get all series IDs that are in any collection
  const collectionSeriesIds = new Set(
    (library.collections || []).flatMap((collection: Collection) =>
      (collection.shows || []).map((series: Series) => series.id),
    ),
  )

  // Filter series to only include those not in any collection
  const standaloneSeries = (library.series || []).filter(
    (series: Series) => !collectionSeriesIds.has(series.id),
  )

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
      {standaloneSeries.length > 0 &&
        standaloneSeries.map((series) => (
          <SeriesCard
            key={series.id}
            series={series}
            mutateLibrary={mutateLibrary}
          />
        ))}
    </>
  )
}

export default SeriesList
