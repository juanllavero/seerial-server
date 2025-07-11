import {
  Collection,
  Library,
  LibraryItem,
  Movie,
} from '@/data/interfaces/Media'
import CollectionCard from '../cards/CollectionCard'
import MovieCard from '../cards/MovieCard'
import { useServerStore } from '@/context/server.context'
import { fetcher } from '@/utils/utils'
import useSWR from 'swr'
import { useReorderableList } from '@/hooks/useReorderableList'
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableItem } from '@/components/lists/SortableItem'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'

interface MoviesListProps {
  library: Library
  mutateLibrary: () => void
}

function MoviesList({ library, mutateLibrary }: MoviesListProps) {
  const serverUrl = useServerStore((state) => state.serverUrl)
  const { data, isLoading } = useSWR(
    serverUrl !== ''
      ? `${serverUrl}/library-content?libraryId=${library.id}&type=Movies`
      : null,
    fetcher,
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
              <MovieCard
                key={item.data.id}
                movie={item.data as Movie}
                mutateLibrary={mutateLibrary}
              />
            )}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  )
}

export default MoviesList
