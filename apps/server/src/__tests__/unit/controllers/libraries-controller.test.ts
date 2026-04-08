import type { Request } from 'express';
import { LibrariesController } from '@/api/v1/libraries/infrastructure/web/controllers/LibrariesController';
import { messages } from '@/config/messages';

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
  useCases: {
    getLibraries: jest.fn(),
    getLibrary: jest.fn(),
    getLibraryContent: jest.fn(),
    scanLibrary: jest.fn(),
    updateLibrary: jest.fn(),
    deleteLibrary: jest.fn(),
    reorderLibraries: jest.fn(),
    reorderLibraryItems: jest.fn(),
  },
}));

jest.mock('@/utils/auth', () => ({
  getUserId: jest.fn(),
}));

const container = jest.requireMock('@/api/v1/shared/infrastructure/adapters/di/container');
const authUtils = jest.requireMock('@/utils/auth');

const asRequest = (value: object) => value as Request;
const uc = (result?: unknown) => ({ execute: jest.fn().mockResolvedValue(result) });

describe('LibrariesController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns all libraries', async () => {
    const libraries = [{ id: 'lib-1' }];
    container.useCases.getLibraries.mockReturnValue(uc(libraries));

    const response = await new LibrariesController().getAll();

    expect(response.success).toBe(true);
    expect(response.data).toEqual(libraries);
  });

  it('returns library by id', async () => {
    const library = { id: 'lib-1', name: 'Movies' };
    container.useCases.getLibrary.mockReturnValue(uc(library));

    const response = await new LibrariesController().getById('lib-1');

    expect(response.data).toEqual(library);
  });

  it('throws not found when library does not exist in getById', async () => {
    container.useCases.getLibrary.mockReturnValue(uc(null));

    await expect(new LibrariesController().getById('missing')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('returns library content for authenticated user', async () => {
    const content = [{ id: 'item-1' }];
    authUtils.getUserId.mockReturnValue('user-1');
    container.useCases.getLibraryContent.mockReturnValue(uc(content));

    const response = await new LibrariesController().getContent('lib-1', asRequest({}));

    expect(response.data).toEqual(content);
    expect(authUtils.getUserId).toHaveBeenCalled();
  });

  it('throws not found when library content is null', async () => {
    authUtils.getUserId.mockReturnValue('user-1');
    container.useCases.getLibraryContent.mockReturnValue(uc(null));

    await expect(
      new LibrariesController().getContent('missing', asRequest({})),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('starts a library scan and returns the library', async () => {
    const library = { id: 'lib-1', name: 'Movies' };
    container.useCases.getLibrary.mockReturnValue(uc(library));
    container.useCases.scanLibrary.mockReturnValue(uc(undefined));

    const response = await new LibrariesController().startScan('lib-1');

    expect(response.data).toEqual(library);
    expect(response.message).toBe(messages.success.scan);
  });

  it('throws not found when library does not exist in startScan', async () => {
    container.useCases.getLibrary.mockReturnValue(uc(null));

    await expect(new LibrariesController().startScan('missing')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('creates a new library (scan returns library)', async () => {
    const library = { id: 'lib-new', name: 'TV Shows' };
    container.useCases.scanLibrary.mockReturnValue(uc(library));

    const body = { name: 'TV Shows', path: '/media/tv', type: 'series' } as never;
    const response = await new LibrariesController().create(body);

    expect(response.data).toEqual(library);
    expect(response.message).toBe(messages.success.create);
  });

  it('throws not found when scan returns null during create', async () => {
    container.useCases.scanLibrary.mockReturnValue(uc(null));

    const body = { name: 'Empty', path: '/empty', type: 'movies' } as never;
    await expect(new LibrariesController().create(body)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('updates a library', async () => {
    const updated = { id: 'lib-1', name: 'Updated' };
    container.useCases.updateLibrary.mockReturnValue(uc(updated));

    const response = await new LibrariesController().update('lib-1', { name: 'Updated' } as never);

    expect(response.data).toEqual(updated);
    expect(response.message).toBe(messages.success.update);
  });

  it('deletes a library', async () => {
    container.useCases.deleteLibrary.mockReturnValue(uc(undefined));

    const response = await new LibrariesController().delete('lib-1');

    expect(response.message).toBe(messages.success.delete);
    expect(response.data).toBeNull();
  });

  it('reorders libraries', async () => {
    container.useCases.reorderLibraries.mockReturnValue(uc(true));

    const response = await new LibrariesController().reorder({
      orderedLibraryIds: ['lib-1', 'lib-2'],
    });

    expect(response.data).toBe(true);
    expect(response.message).toBe(messages.success.order);
  });

  it('reorders library items', async () => {
    container.useCases.reorderLibraryItems.mockReturnValue(uc(true));

    const response = await new LibrariesController().reorderItems('lib-1', {
      orderedItems: ['item-1', 'item-2'],
    } as never);

    expect(response.data).toBe(true);
    expect(response.message).toBe(messages.success.order);
  });
});
