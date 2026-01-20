import { SortableGrid } from '@/components/lists/SortableGrid'
import { API, authenticatedFetcher } from '@/config/api'
import { Collection, Library, LibraryItem } from '@/data/interfaces/Media'
import { Album } from '@/data/interfaces/Music'
import { useReorderableList } from '@/hooks/useReorderableList'
import useSWR from 'swr'
import AlbumCard from '../cards/AlbumCard'
import CollectionCard from '../cards/CollectionCard'

interface AlbumListProps {
  library: Library
  mutateLibrary: () => void
}

function AlbumList({ library, mutateLibrary }: AlbumListProps) {
  const { data, isLoading } = useSWR<LibraryItem[]>(
    `${API.libraries.content(library.id)}?type=Music`,
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
            type={'Music'}
          />
        ) : (
          <AlbumCard key={item.data.id} album={item.data as Album} />
        )
      }
    />
  )
}

export default AlbumList
