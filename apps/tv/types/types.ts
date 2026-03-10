import type { Movie, Series } from '@/data/interfaces/Media'
import type { Album } from '@/data/interfaces/Music'

type ContentType = 'Music' | 'Shows' | 'Movies'
type CollectionKey = keyof CollectionItems
type CollectionItems = {
  albums: Album[]
  movies: Movie[]
  shows: Series[]
}

export type { CollectionItems, CollectionKey, ContentType }
