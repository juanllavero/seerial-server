import type { Request } from 'express';
import { EpisodesController } from '@/api/v1/episodes/infrastructure/web/controllers/EpisodesController';
import { PlayListController } from '@/api/v1/playlists/infrastructure/web/controllers/PlayListController';
import { SeasonsController } from '@/api/v1/seasons/infrastructure/web/controllers/SeasonsController';
import { messages } from '@/config/messages';

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
  useCases: {
    getPlayLists: jest.fn(),
    getPlayListById: jest.fn(),
    createPlayList: jest.fn(),
    updatePlayList: jest.fn(),
    deletePlayList: jest.fn(),
    addSongToPlayList: jest.fn(),
    removeSongFromPlayList: jest.fn(),
    getSeasonById: jest.fn(),
    updateSeason: jest.fn(),
    deleteSeason: jest.fn(),
    setEpisodeWatchState: jest.fn(),
    updateEpisode: jest.fn(),
    deleteEpisode: jest.fn(),
  },
  episodesRepo: {
    findById: jest.fn(),
  },
}));

const container = jest.requireMock('@/api/v1/shared/infrastructure/adapters/di/container');

const asRequest = (value: object) => value as Request;
const uc = (result?: unknown) => ({ execute: jest.fn().mockResolvedValue(result) });

describe('PlayListController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns all playlists', async () => {
    const playlists = [{ id: 'pl-1' }, { id: 'pl-2' }];
    container.useCases.getPlayLists.mockReturnValue(uc(playlists));

    const response = await new PlayListController().getAll();

    expect(response.success).toBe(true);
    expect(response.data).toEqual(playlists);
  });

  it('returns playlist by id', async () => {
    const playlist = { id: 'pl-1', name: 'Favorites' };
    container.useCases.getPlayListById.mockReturnValue(uc(playlist));

    const response = await new PlayListController().getById('pl-1');

    expect(response.data).toEqual(playlist);
  });

  it('throws not found when playlist does not exist', async () => {
    container.useCases.getPlayListById.mockReturnValue(uc(null));

    await expect(new PlayListController().getById('missing')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('creates a new playlist', async () => {
    const playlist = { id: 'pl-new', name: 'New' };
    container.useCases.createPlayList.mockReturnValue(uc(playlist));

    const response = await new PlayListController().create({ name: 'New' } as never);

    expect(response.message).toBe(messages.success.create);
    expect(response.data).toEqual(playlist);
  });

  it('updates a playlist', async () => {
    const updated = { id: 'pl-1', name: 'Updated' };
    container.useCases.updatePlayList.mockReturnValue(uc(updated));

    const response = await new PlayListController().update('pl-1', { name: 'Updated' } as never);

    expect(response.data).toEqual(updated);
  });

  it('deletes a playlist', async () => {
    container.useCases.deletePlayList.mockReturnValue(uc(undefined));

    const response = await new PlayListController().delete('pl-1');

    expect(response.message).toBe(messages.success.delete);
    expect(response.data).toBeNull();
  });

  it('adds a song to a playlist', async () => {
    container.useCases.addSongToPlayList.mockReturnValue(uc(undefined));

    const response = await new PlayListController().addSong('pl-1', { songId: 'song-1' } as never);

    expect(response.message).toBe(messages.success.create);
    expect(container.useCases.addSongToPlayList().execute).toHaveBeenCalledWith('pl-1', 'song-1');
  });

  it('removes a song from a playlist', async () => {
    container.useCases.removeSongFromPlayList.mockReturnValue(uc(undefined));

    const response = await new PlayListController().removeSong('pl-1', 'song-1');

    expect(response.message).toBe(messages.success.delete);
    expect(container.useCases.removeSongFromPlayList().execute).toHaveBeenCalledWith(
      'pl-1',
      'song-1',
    );
  });
});

describe('SeasonsController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('gets a season by id', async () => {
    const season = { id: 'season-1', episodes: [] };
    container.useCases.getSeasonById.mockReturnValue(uc(season));

    const response = await new SeasonsController().get('season-1');

    expect(response.data).toEqual(season);
  });

  it('throws not found when season does not exist', async () => {
    container.useCases.getSeasonById.mockReturnValue(uc(null));

    await expect(new SeasonsController().get('missing')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('updates a season', async () => {
    const updated = { id: 'season-1', name: 'Season 1 Updated' };
    container.useCases.updateSeason.mockReturnValue(uc(updated));

    const response = await new SeasonsController().update('season-1', {
      name: 'Season 1 Updated',
    } as never);

    expect(response.data).toEqual(updated);
  });

  it('deletes a season', async () => {
    container.useCases.deleteSeason.mockReturnValue(uc(undefined));

    const response = await new SeasonsController().delete('season-1');

    expect(response.message).toBe(messages.success.delete);
  });

  it('throws 400 when userId is missing in setWatchState', async () => {
    await expect(
      new SeasonsController().setWatchState('season-1', { watched: true } as never, asRequest({})),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws not found when season does not exist in setWatchState', async () => {
    container.useCases.getSeasonById.mockReturnValue(uc(null));

    await expect(
      new SeasonsController().setWatchState(
        'missing',
        { watched: true, userId: 'user-1' } as never,
        asRequest({}),
      ),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('sets episode watch state for the last episode when marking season as watched', async () => {
    const episodeExec = jest.fn().mockResolvedValue(undefined);
    const season = {
      id: 'season-1',
      episodes: [
        { id: 'ep-1', episodeNumber: 1 },
        { id: 'ep-2', episodeNumber: 2 },
      ],
    };

    container.useCases.getSeasonById
      .mockReturnValueOnce(uc(season))
      .mockReturnValueOnce(uc(season));
    container.useCases.setEpisodeWatchState.mockReturnValue({ execute: episodeExec });

    await new SeasonsController().setWatchState(
      'season-1',
      { watched: true } as never,
      asRequest({ user: { id: 'user-1' } } as never),
    );

    expect(episodeExec).toHaveBeenCalledWith('ep-2', 'user-1', true);
  });

  it('sets episode watch state for the first episode when marking season as not watched', async () => {
    const episodeExec = jest.fn().mockResolvedValue(undefined);
    const season = {
      id: 'season-1',
      episodes: [
        { id: 'ep-1', episodeNumber: 1 },
        { id: 'ep-2', episodeNumber: 2 },
      ],
    };

    container.useCases.getSeasonById
      .mockReturnValueOnce(uc(season))
      .mockReturnValueOnce(uc(season));
    container.useCases.setEpisodeWatchState.mockReturnValue({ execute: episodeExec });

    await new SeasonsController().setWatchState(
      'season-1',
      { watched: false, userId: 'user-1' } as never,
      asRequest({}),
    );

    expect(episodeExec).toHaveBeenCalledWith('ep-1', 'user-1', false);
  });
});

describe('EpisodesController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns episode by id (including null)', async () => {
    container.episodesRepo.findById.mockResolvedValue({ id: 'ep-1' });

    const response = await new EpisodesController().get('ep-1');

    expect(response.data).toEqual({ id: 'ep-1' });
  });

  it('returns null when episode does not exist in get', async () => {
    container.episodesRepo.findById.mockResolvedValue(null);

    const response = await new EpisodesController().get('missing');

    expect(response.data).toBeNull();
  });

  it('updates an episode', async () => {
    const updated = { id: 'ep-1', title: 'Pilot' };
    container.useCases.updateEpisode.mockReturnValue(uc(updated));

    const response = await new EpisodesController().update('ep-1', { title: 'Pilot' } as never);

    expect(response.data).toEqual(updated);
  });

  it('deletes an episode', async () => {
    container.useCases.deleteEpisode.mockReturnValue(uc(undefined));

    const response = await new EpisodesController().delete('ep-1');

    expect(response.message).toBe(messages.success.delete);
  });

  it('throws 400 when userId is missing in setWatchState', async () => {
    await expect(
      new EpisodesController().setWatchState('ep-1', { state: true } as never, asRequest({})),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('sets episode watch state for authenticated user', async () => {
    const execMock = jest.fn().mockResolvedValue(undefined);
    container.useCases.setEpisodeWatchState.mockReturnValue({ execute: execMock });

    const response = await new EpisodesController().setWatchState(
      'ep-1',
      { state: true } as never,
      asRequest({ user: { id: 'user-1' } } as never),
    );

    expect(execMock).toHaveBeenCalledWith('ep-1', 'user-1', true);
    expect(response.success).toBe(true);
  });
});
