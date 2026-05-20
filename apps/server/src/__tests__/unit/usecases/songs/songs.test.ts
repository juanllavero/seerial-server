import type { SongsRepositoryPort } from '@/api/v1/songs/application/ports/SongsRepositoryPort';
import { CreateSongUseCase } from '@/api/v1/songs/application/usecases/CreateSongUseCase';
import { DeleteSongUseCase } from '@/api/v1/songs/application/usecases/DeleteSongUseCase';
import { FindSongByIdUseCase } from '@/api/v1/songs/application/usecases/FindSongByIdUseCase';
import { FindSongByPathUseCase } from '@/api/v1/songs/application/usecases/FindSongByPathUseCase';
import { FindSongsByAlbumIdUseCase } from '@/api/v1/songs/application/usecases/FindSongsByAlbumIdUseCase';
import { UpdateSongUseCase } from '@/api/v1/songs/application/usecases/UpdateSongUseCase';
import type { Song } from '@/api/v1/songs/domain/Song';

function buildSong(overrides: Partial<Song> = {}): Song {
  return {
    id: 'song-1',
    title: 'One More Time',
    albumId: 'album-1',
    fileSrc: '/music/album-1/one-more-time.mp3',
    ...overrides,
  } as unknown as Song;
}

function buildSongsRepo(overrides: Partial<SongsRepositoryPort> = {}): SongsRepositoryPort {
  return {
    findById: jest.fn(),
    findByPath: jest.fn(),
    findByAlbum: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  };
}

describe('Song use cases', () => {
  describe('CreateSongUseCase', () => {
    it('creates a song through the repository', async () => {
      const song = buildSong();
      const repo = buildSongsRepo({
        create: jest.fn().mockResolvedValue(song),
      });

      const result = await new CreateSongUseCase(repo).execute({
        title: 'One More Time',
      });

      expect(result).toEqual(song);
      expect(repo.create).toHaveBeenCalledWith({ title: 'One More Time' });
    });

    it('returns null when the repository does not create a song', async () => {
      const repo = buildSongsRepo({
        create: jest.fn().mockResolvedValue(null),
      });

      await expect(new CreateSongUseCase(repo).execute({ title: 'Missing' })).resolves.toBeNull();
    });
  });

  describe('FindSongByIdUseCase', () => {
    it('returns a song by id', async () => {
      const song = buildSong();
      const repo = buildSongsRepo({
        findById: jest.fn().mockResolvedValue(song),
      });

      const result = await new FindSongByIdUseCase(repo).execute(song.id);

      expect(result).toEqual(song);
      expect(repo.findById).toHaveBeenCalledWith(song.id);
    });

    it('returns null when the song does not exist', async () => {
      const repo = buildSongsRepo({
        findById: jest.fn().mockResolvedValue(null),
      });

      await expect(new FindSongByIdUseCase(repo).execute('missing')).resolves.toBeNull();
    });
  });

  describe('FindSongByPathUseCase', () => {
    it('returns a song by file path', async () => {
      const song = buildSong();
      const repo = buildSongsRepo({
        findByPath: jest.fn().mockResolvedValue(song),
      });

      const result = await new FindSongByPathUseCase(repo).execute(song.fileSrc);

      expect(result).toEqual(song);
      expect(repo.findByPath).toHaveBeenCalledWith(song.fileSrc);
    });
  });

  describe('FindSongsByAlbumIdUseCase', () => {
    it('returns all songs for an album', async () => {
      const songs = [buildSong(), buildSong({ id: 'song-2', title: 'Aerodynamic' })];
      const repo = buildSongsRepo({
        findByAlbum: jest.fn().mockResolvedValue(songs),
      });

      const result = await new FindSongsByAlbumIdUseCase(repo).execute('album-1');

      expect(result).toEqual(songs);
      expect(repo.findByAlbum).toHaveBeenCalledWith('album-1');
    });
  });

  describe('UpdateSongUseCase', () => {
    it('updates a song through the repository', async () => {
      const song = buildSong({ title: 'Updated Song' });
      const repo = buildSongsRepo({
        update: jest.fn().mockResolvedValue(song),
      });

      const result = await new UpdateSongUseCase(repo).execute('song-1', {
        title: 'Updated Song',
      });

      expect(result).toEqual(song);
      expect(repo.update).toHaveBeenCalledWith('song-1', {
        title: 'Updated Song',
      });
    });
  });

  describe('DeleteSongUseCase', () => {
    it('deletes a song through the repository', async () => {
      const repo = buildSongsRepo({
        delete: jest.fn().mockResolvedValue(undefined),
      });

      await expect(new DeleteSongUseCase(repo).execute('song-1')).resolves.toBeUndefined();
      expect(repo.delete).toHaveBeenCalledWith('song-1');
    });
  });
});
