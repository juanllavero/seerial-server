import { SortableGrid } from '@/components/lists/SortableGrid'
import { API, authenticatedFetcher } from '@/config/api'
import { LibraryTypes } from '@/data/enums/LibraryTypes'
import {
  Collection,
  Library,
  LibraryItem,
  Movie,
  Series,
} from '@/data/interfaces/Media'
import { Album } from '@/data/interfaces/Music'
import { useReorderableList } from '@/hooks/useReorderableList'
import { memo } from 'react'
import useSWR from 'swr'
import AlbumCard from './cards/AlbumCard'
import CollectionCard from './cards/CollectionCard'
import MovieCard from './cards/MovieCard'
import SeriesCard from './cards/SeriesCard'

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

  const { data, isLoading } = useSWR<LibraryItem[]>(
    `${API.libraries.content(library.id)}?type=${queryType}`,
    authenticatedFetcher,
  )

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
      renderItem={(item: LibraryItem) => {
        if (item.type === 'collection') {
          return (
            <CollectionCard
              key={item.data.id}
              libraryId={library.id}
              collection={item.data as Collection}
              type={queryType}
            />
          )
        }
        switch (library.type) {
          case LibraryTypes.MUSIC:
            return <AlbumCard key={item.data.id} album={item.data as Album} />
          case LibraryTypes.SHOWS:
            return (
              <SeriesCard
                key={item.data.id}
                series={item.data as Series}
                remainingEpisodes={item.remainingItems ?? 0}
              />
            )
          default: // Default MOVIES
            return <MovieCard key={item.data.id} movie={item.data as Movie} />
        }
      }}
    />
  )
}

export default memo(MediaList)
