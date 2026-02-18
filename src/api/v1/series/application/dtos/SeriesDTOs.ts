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
