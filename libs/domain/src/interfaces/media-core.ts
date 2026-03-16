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
}

export interface DetailsData {
    title: string;
    subtitle?: string;
    tagline?: string;
    info: string[];
    genres: string;
    score?: number;
    imdbScore?: number;
    description: string;
    directedBy?: string;
    watched?: boolean;
    inMyList?: boolean;
    coverSrc?: string;
    backgroundSrc?: string;
}

export type ItemType = "series" | "movie" | "album" | "collection";

export type LibraryType = "Shows" | "Movies" | "Music";
