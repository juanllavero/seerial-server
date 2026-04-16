export interface UpdateEpisodeDTO {
	title?: string;
	episodeNumber?: number;
	description?: string;
	airDate?: string;
	duration?: number;
}

export interface SetEpisodeWatchStateDTO {
	state: boolean;
}
