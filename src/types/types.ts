import { Movie, Series } from '@/data/interfaces/Media'
import { Album } from '@/data/interfaces/Music'

type DisplayCollections =
  | 'collectionsAndElements'
  | 'onlyCollections'
  | 'onlyElements'

type ContentType = 'Music' | 'Shows' | 'Movies'
type CollectionKey = keyof CollectionItems
type CollectionItems = {
  albums: Album[]
  movies: Movie[]
  shows: Series[]
}

export { DisplayCollections, CollectionKey, CollectionItems, ContentType }
