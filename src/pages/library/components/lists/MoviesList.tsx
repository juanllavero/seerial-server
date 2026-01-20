import { SortableGrid } from '@/components/lists/SortableGrid'
import { API, authenticatedFetcher } from '@/config/api'
import {
  Collection,
  Library,
  LibraryItem,
  Movie,
} from '@/data/interfaces/Media'
import { useReorderableList } from '@/hooks/useReorderableList'
import useSWR from 'swr'
import CollectionCard from '../cards/CollectionCard'
import MovieCard from '../cards/MovieCard'

interface MoviesListProps {
  library: Library
  mutateLibrary: () => void
}

function MoviesList({ library, mutateLibrary }: MoviesListProps) {
  const { data, isLoading } = useSWR<LibraryItem[]>(
    `${API.libraries.content(library.id)}?type=Movies`,
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
            type={'Movies'}
          />
        ) : (
          <MovieCard key={item.data.id} movie={item.data as Movie} />
        )
      }
    />
  )
}

export default MoviesList
