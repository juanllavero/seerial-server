//#region SERIES
export interface RefreshMetadataDTO {
    id: string;
}

export interface UpdateShowIdDTO {
    id: string;
    themdbId: number;
}

export interface UpdateEpisodeGroupDTO {
    id: string;
    themdbId: number;
    episodeGroupId: string;
}

export interface UpdateSeriesDTO {
    name?: string;
    nameLock?: boolean;
    overview?: string;
    overviewLock?: boolean;
    year?: string;
    yearLock?: boolean;
    score?: number;
    tagline?: string;
    taglineLock?: boolean;
    logoSrc?: string;
    logosUrls?: string[];
    coverSrc?: string;
    coversUrls?: string[];
    productionStudios?: string[];
    productionStudiosLock?: boolean;
    creator?: string[];
    creatorLock?: boolean;
    musicComposer?: string[];
    musicComposerLock?: boolean;
    genres?: string[];
    genresLock?: boolean;
    preferAudioLan?: string;
    preferSubLan?: string;
    subsMode?: string;
    folder?: string;
    episodeGroupId?: string | null;
    analyzingFiles?: boolean;
}

export interface SetSeriesWatchStateDTO {
    watched: boolean;
    userId: string;
}

export interface UpdateSeasonDTO {
    name?: string;
    nameLock?: boolean;
    year?: string;
    yearLock?: boolean;
    overview?: string;
    overviewLock?: boolean;
    seasonNumber?: number;
    backgroundSrc?: string;
    backgroundsUrls?: string[];
    videoSrc?: string;
    musicSrc?: string;
}

export interface SetSeasonWatchStateDTO {
    watched: boolean;
    userId: string;
}

export interface UpdateEpisodeDTO {
    name: string;
    nameLock: boolean;
    year: string;
    yearLock: boolean;
    overview: string;
    overviewLock: boolean;
    directedBy: string[];
    directedByLock: boolean;
    writtenBy: string[];
    writtenByLock: boolean;
}

export interface SetEpisodeWatchStateDTO {
    state: boolean;
}
//#endregion

//#region MOVIES
export interface RefreshMetadataDTO {
    id: string;
}

export interface ChangeIdentificationDTO {
    themdbId: number;
}

export interface UpdateMovieDTO {
    name?: string;
    nameLock?: boolean;
    overview?: string;
    overviewLock?: boolean;
    year?: string;
    yearLock?: boolean;
    tagline?: string;
    taglineLock?: boolean;
    genres?: string[];
    genresLock?: boolean;
    productionStudios?: string[];
    productionStudiosLock?: boolean;
    directedBy?: string[];
    directedByLock?: boolean;
    writtenBy?: string[];
    writtenByLock?: boolean;
    creator?: string[];
    creatorLock?: boolean;
    musicComposer?: string[];
    musicComposerLock?: boolean;
    videoSrc?: string;
    musicSrc?: string;
    logoSrc?: string;
    logosUrls?: string[];
    backgroundSrc?: string;
    backgroundsUrls?: string[];
    coverSrc?: string;
    coversUrls?: string[];
}

export interface SetMovieWatchStateDTO {
    watched: boolean;
}

//#endregion

//#region MUSIC
export interface UpdateAlbumDTO {
    title?: string;
    year?: string;
    genres?: string[];
    folder?: string;
    description?: string;
    coverSrc?: string;
}

//#endregion

//region COLLECTIONS
export interface UpdateCollectionDTO {
    title?: string;
    description?: string;
    backgroundSrc?: string;
    backgroundsUrls?: string[];
    coverSrc?: string;
    coversUrls?: string[];
    musicPosterSrc?: string;
}
//endregion