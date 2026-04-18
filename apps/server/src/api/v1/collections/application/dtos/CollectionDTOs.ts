export interface ReorderItemDTO {
	id: string;
	type: "movie" | "movies" | "series" | "show" | "shows" | "album" | "albums";
}

export interface MusicExtrasDTO {
	title: string;
	src: string;
	type: string;
}

export interface ReorderContentDTO {
	orderedItems: ReorderItemDTO[];
}

export interface CollectionContentDTO {
	movies: import("@seerial/domain").LibraryItem[];
	series: import("@seerial/domain").LibraryItem[];
	albums: import("@seerial/domain").LibraryItem[];
}

export interface UpdateCollectionDTO {
	title?: string;
	description?: string;
	backgroundSrc?: string;
	backgroundsUrls?: string[];
	coverSrc?: string;
	coversUrls?: string[];
	musicPosterSrc?: string;
}
