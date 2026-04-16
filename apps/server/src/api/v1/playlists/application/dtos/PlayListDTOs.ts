export interface CreatePlayListDTO {
	title: string;
	description?: string;
}

export interface UpdatePlayListDTO {
	title?: string;
	description?: string;
}

export interface AddSongToPlaylistDTO {
	songId: string;
}
