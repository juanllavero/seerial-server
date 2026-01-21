import { SortableGrid } from '@/components/lists/SortableGrid'
import { API, authenticatedFetcher } from '@/config/api'
import { LibraryTypes } from '@/data/enums/LibraryTypes'
import { Library, LibraryItem } from '@/data/interfaces/Media'
import { APIResponse } from '@/data/interfaces/Utils'
import { useReorderableList } from '@/hooks/useReorderableList'
import { memo } from 'react'
import useSWR from 'swr'
import MediaCard from './cards/MediaCard'

interface MediaListProps {
  library: Library
  mutateLibrary: () => void
}

function MediaList({ library, mutateLibrary }: MediaListProps) {
  const queryType =
    library.type === LibraryTypes.MUSIC
      ? 'Music'
      : library.type === LibraryTypes.SHOWS
        ? 'Shows'
        : 'Movies'

  const { data, isLoading } = useSWR<APIResponse<LibraryItem[]>>(
    `${API.libraries.content(library.id)}?type=${queryType}`,
    authenticatedFetcher,
  )

  const libraryItems = data && data.data ? data.data : []

  const { items, handleDragEnd } = useReorderableList(
    libraryItems,
    library.id,
    mutateLibrary,
  )

  if (isLoading) return null

  return (
    <SortableGrid
      items={items}
      onDragEnd={handleDragEnd}
      renderItem={(item: LibraryItem) => (
        <MediaCard key={item.data.id} item={item} library={library} />
      )}
    />
  )
}

export default memo(MediaList)
