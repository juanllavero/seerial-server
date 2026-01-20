import { SortableGrid } from '@/components/lists/SortableGrid'
import { API, authenticatedFetcher } from '@/config/api'
import {
  Collection,
  Library,
  LibraryItem,
  Series,
} from '@/data/interfaces/Media'
import { useReorderableList } from '@/hooks/useReorderableList'
import useSWR from 'swr'
import CollectionCard from '../cards/CollectionCard'
import SeriesCard from '../cards/SeriesCard'

interface SeriesListProps {
  library: Library
  mutateLibrary: () => void
}

function SeriesList({ library, mutateLibrary }: SeriesListProps) {
  const { data, isLoading } = useSWR<LibraryItem[]>(
    `${API.libraries.content(library.id)}?type=Shows`,
    authenticatedFetcher,
  )

  // Hook to reorderable list
  const { items, handleDragEnd } = useReorderableList(
    data,
    library.id,
    mutateLibrary,
  )

  if (isLoading) return null

  return (
    <SortableGrid
      items={items}
      onDragEnd={handleDragEnd}
      renderItem={(item: LibraryItem) =>
        item.type === 'collection' ? (
          <CollectionCard
            key={item.data.id}
            libraryId={library.id}
            collection={item.data as Collection}
            type={'Shows'}
          />
        ) : (
          <SeriesCard
            key={item.data.id}
            series={item.data as Series}
            remainingEpisodes={item.remainingItems ?? 0}
          />
        )
      }
    />
  )
}

export default SeriesList
