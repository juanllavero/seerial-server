import { SortableItem } from '@/components/lists/SortableItem'
import { useServerStore } from '@/context/server.context'
import {
  Collection,
  Library,
  LibraryItem,
  Series,
} from '@/data/interfaces/Media'
import { useReorderableList } from '@/hooks/useReorderableList'
import { authenticatedFetcher } from '@/utils/utils'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import useSWR from 'swr'
import CollectionCard from '../cards/CollectionCard'
import SeriesCard from '../cards/SeriesCard'

interface SeriesListProps {
  library: Library
  mutateLibrary: () => void
}

function SeriesList({ library, mutateLibrary }: SeriesListProps) {
  const serverUrl = useServerStore((state) => state.serverUrl)
  const { data, isLoading } = useSWR(
    serverUrl !== ''
      ? `${serverUrl}/library-content?libraryId=${library.id}&type=Shows`
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
                type={'Shows'}
              />
            ) : (
              <SeriesCard
                key={item.data.id}
                series={item.data as Series}
                remainingEpisodes={item.remainingItems ?? 0}
              />
            )}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  )
}

export default SeriesList
