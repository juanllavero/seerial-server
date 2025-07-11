import {
  Collection,
  Library,
  LibraryItem,
  Series,
} from '@/data/interfaces/Media'
import CollectionCard from '../cards/CollectionCard'
import SeriesCard from '../cards/SeriesCard'
import { useServerStore } from '@/context/server.context'
import { fetcher } from '@/utils/utils'
import useSWR from 'swr'
import { SortableItem } from '@/components/lists/SortableItem'
import { useReorderableList } from '@/hooks/useReorderableList'
import {
  useSensors,
  useSensor,
  PointerSensor,
  DndContext,
  closestCenter,
} from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'

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
                type={'Shows'}
              />
            ) : (
              <SeriesCard
                key={item.data.id}
                series={item.data as Series}
                mutateLibrary={mutateLibrary}
              />
            )}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  )
}

export default SeriesList
