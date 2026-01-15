import { PlayList } from "../../domain/PlayList";

export interface PlayListRepositoryPort {
  findAll(): Promise<PlayList[]>;
  findById(id: string): Promise<PlayList | null>;
  create(playList: PlayList): Promise<PlayList>;
  update(id: string, playList: Partial<PlayList>): Promise<PlayList>;
  delete(id: string): Promise<void>;
  addSongToPlaylist(playlistId: string, songId: string): Promise<void>;
  removeSongFromPlaylist(playlistId: string, songId: string): Promise<void>;
}
