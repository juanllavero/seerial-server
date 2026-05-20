import type { ArtistsRepositoryPort } from '@/api/v1/artists/application/ports/ArtistsRepositoryPort';
import { AddArtistUseCase } from '@/api/v1/artists/application/usecases/AddArtistUseCase';
import { DeleteArtistUseCase } from '@/api/v1/artists/application/usecases/DeleteArtistUseCase';
import { GetArtistByIdUseCase } from '@/api/v1/artists/application/usecases/GetArtistByIdUseCase';
import { UpdateArtistUseCase } from '@/api/v1/artists/application/usecases/UpdateArtistUseCase';
import type { Artist } from '@/api/v1/artists/domain/Artist';

function buildArtist(overrides: Partial<Artist> = {}): Artist {
  return {
    id: 'artist-1',
    name: 'Daft Punk',
    ...overrides,
  } as Artist;
}

function buildArtistsRepo(overrides: Partial<ArtistsRepositoryPort> = {}): ArtistsRepositoryPort {
  return {
    getById: jest.fn(),
    getByName: jest.fn(),
    add: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  };
}

describe('Artist use cases', () => {
  describe('AddArtistUseCase', () => {
    it('adds an artist through the repository', async () => {
      const artist = buildArtist();
      const repo = buildArtistsRepo({
        add: jest.fn().mockResolvedValue(artist),
      });

      const result = await new AddArtistUseCase(repo).execute({
        name: 'Daft Punk',
      });

      expect(result).toEqual(artist);
      expect(repo.add).toHaveBeenCalledWith({ name: 'Daft Punk' });
    });
  });

  describe('GetArtistByIdUseCase', () => {
    it('returns an artist by id', async () => {
      const artist = buildArtist();
      const repo = buildArtistsRepo({
        getById: jest.fn().mockResolvedValue(artist),
      });

      const result = await new GetArtistByIdUseCase(repo).execute(artist.id);

      expect(result).toEqual(artist);
      expect(repo.getById).toHaveBeenCalledWith(artist.id);
    });

    it('returns null when the artist does not exist', async () => {
      const repo = buildArtistsRepo({
        getById: jest.fn().mockResolvedValue(null),
      });

      await expect(new GetArtistByIdUseCase(repo).execute('missing')).resolves.toBeNull();
    });
  });

  describe('UpdateArtistUseCase', () => {
    it('updates an artist through the repository', async () => {
      const artist = buildArtist({ name: 'Updated Daft Punk' });
      const repo = buildArtistsRepo({
        update: jest.fn().mockResolvedValue(artist),
      });

      const result = await new UpdateArtistUseCase(repo).execute('artist-1', {
        name: 'Updated Daft Punk',
      });

      expect(result).toEqual(artist);
      expect(repo.update).toHaveBeenCalledWith('artist-1', {
        name: 'Updated Daft Punk',
      });
    });
  });

  describe('DeleteArtistUseCase', () => {
    it('deletes the artist through the repository', async () => {
      const repo = buildArtistsRepo({
        delete: jest.fn().mockResolvedValue(true),
      });

      await expect(new DeleteArtistUseCase(repo).execute('artist-1')).resolves.toBeUndefined();
      expect(repo.delete).toHaveBeenCalledWith('artist-1');
    });
  });
});
