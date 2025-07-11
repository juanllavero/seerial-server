import { Collection, Library, LibraryItem } from '@/data/interfaces/Media'
import AlbumCard from '../cards/AlbumCard'
import CollectionCard from '../cards/CollectionCard'
import { Album } from '@/data/interfaces/Music'
import useSWR from 'swr'
import { fetcher } from '@/utils/utils'
import { useServerStore } from '@/context/server.context'
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

interface AlbumListProps {
  library: Library
  mutateLibrary: () => void
}

function AlbumList({ library, mutateLibrary }: AlbumListProps) {
  const serverUrl = useServerStore((state) => state.serverUrl)
  const { data, isLoading } = useSWR(
    serverUrl !== ''
      ? `${serverUrl}/library-content?libraryId=${library.id}&type=Music`
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
                type={'Music'}
              />
            ) : (
              <AlbumCard key={item.data.id} album={item.data as Album} />
            )}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  )
}

export default AlbumList
