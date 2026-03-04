import { Movie, Series } from './Media'

export interface MyListItem {
	id: number
	addedAt: string
	series?: Series
	movie?: Movie
}

export interface PlayList {
	id: string
	title: string
	description?: string
}

export interface ContinueWatchingElement {
	id: string
	title: string
	subtitle?: string
	episodeNumber?: number
	seasonNumber?: number
	date: string
	duration: number
	timeWatched: number
	genres: string[]
	overview: string
	backgroundImage?: string
	posterImage?: string
	logoImage?: string
	videoImage?: string
	episodeId?: string
	movieId?: string
	videoId?: string
}
