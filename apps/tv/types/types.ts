import { Movie, Series } from '@/data/interfaces/Media'
import { Album } from '@/data/interfaces/Music'

type ContentType = 'Music' | 'Shows' | 'Movies'
type CollectionKey = keyof CollectionItems
type CollectionItems = {
	albums: Album[]
	movies: Movie[]
	shows: Series[]
}

export { CollectionKey, CollectionItems, ContentType }
