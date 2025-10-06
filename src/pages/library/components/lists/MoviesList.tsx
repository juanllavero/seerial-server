import { SortableItem } from '@/components/lists/SortableItem'
import { useServerStore } from '@/context/server.context'
import {
  Collection,
  Library,
  LibraryItem,
  Movie,
} from '@/data/interfaces/Media'
import { useReorderableList } from '@/hooks/useReorderableList'
import { authenticatedFetcher } from '@/utils/utils'
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import useSWR from 'swr'
import CollectionCard from '../cards/CollectionCard'
import MovieCard from '../cards/MovieCard'

interface MoviesListProps {
  library: Library
  mutateLibrary: () => void
}

function MoviesList({ library, mutateLibrary }: MoviesListProps) {
  const serverUrl = useServerStore((state) => state.serverUrl)
  const { data, isLoading } = useSWR<LibraryItem[]>(
    serverUrl !== ''
      ? `${serverUrl}/library-content?libraryId=${library.id}&type=Movies`
      : null,
    authenticatedFetcher,
  )

  // Hook to reorderable list
  const { items, handleDragEnd } = useReorderableList(
    data,
    library.id,
    mutateLibrary,
  )

  // Configure dnd sensor
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  if (isLoading) return null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.data.id)}
        strategy={rectSortingStrategy}
      >
        {items.map((item: LibraryItem) => (
          <SortableItem key={item.data.id} id={item.data.id}>
            {item.type === 'collection' ? (
              <CollectionCard
                key={item.data.id}
                libraryId={library.id}
                collection={item.data as Collection}
                type={'Movies'}
              />
            ) : (
              <MovieCard key={item.data.id} movie={item.data as Movie} />
            )}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  )
}

export default MoviesList
