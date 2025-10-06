import { SortableItem } from '@/components/lists/SortableItem'
import { useServerStore } from '@/context/server.context'
import { Collection, Library, LibraryItem } from '@/data/interfaces/Media'
import { Album } from '@/data/interfaces/Music'
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
import AlbumCard from '../cards/AlbumCard'
import CollectionCard from '../cards/CollectionCard'

interface AlbumListProps {
  library: Library
  mutateLibrary: () => void
}

function AlbumList({ library, mutateLibrary }: AlbumListProps) {
  const serverUrl = useServerStore((state) => state.serverUrl)
  const { data, isLoading } = useSWR<LibraryItem[]>(
    serverUrl !== ''
      ? `${serverUrl}/library-content?libraryId=${library.id}&type=Music`
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
