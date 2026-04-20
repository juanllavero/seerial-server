export interface CastData {
    name: string;
    character: string;
    profileImage: string;
}

export interface CollectionData {
    id: string;
    title: string;
    images: {
        poster?: string | null;
        background?: string | null;
        images: string[];
    };
    musicPosterSrc?: string;
    numberOfItems: number;
}

export interface LibraryItem {
    id: string;
    title: string;
    years?: string;
    coverSrc?: string;
    backgroundSrc?: string;
    numberOfItems: number;
    order: number;
    watched: boolean;
    remainingItems: number;
    analyzingFiles: boolean;
    type: ItemType;
    details: DetailsData | null;
    currentSeasonNumber?: number;
}

export interface DetailsData {
    title: string;
    subtitle?: string;
    tagline?: string;
    year?: string;
    genres: string;
    score?: number;
    imdbScore?: number;
    description: string;
    directedBy?: string;
    createdBy?: string;
    watched?: boolean;
    coverSrc?: string;
    logoSrc?: string;
    backgroundSrc?: string;
}

export interface ContinueWatchingVideoDTO {
    id: string;
    title: string;
    subtitle?: string;
    episodeNumber?: number;
    seasonNumber?: number;
    date: string;
    duration: number;
    timeWatched: number;
    genres: string[];
    overview: string;
    backgroundImage: string;
    posterImage: string;
    logoImage: string;
    videoImage: string;
    movieId?: string;
    episodeId?: string;
    seriesId?: string;
    videoId: string;
    details: DetailsData | null;
}


export type ItemType = "series" | "movie" | "album" | "collection";

export type LibraryType = "Shows" | "Movies" | "Music";
