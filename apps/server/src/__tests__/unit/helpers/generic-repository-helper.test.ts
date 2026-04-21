import { BaseEntity } from 'typeorm';
import { GenericRepositoryHelper } from '@/helpers/GenericRepositoryHelper';

class TestEntity extends BaseEntity {
  id!: string;
  name!: string;
}

describe('GenericRepositoryHelper', () => {
  const createHelper = () =>
    new GenericRepositoryHelper<TestEntity, TestEntity>(
      TestEntity as typeof BaseEntity & (new () => TestEntity),
      {
        entityName: 'TestEntity',
        generateShortId: true,
      },
    );

  const createFullIdHelper = () =>
    new GenericRepositoryHelper<TestEntity, TestEntity>(
      TestEntity as typeof BaseEntity & (new () => TestEntity),
      {
        entityName: 'TestEntity',
        generateShortId: false,
      },
    );

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('findById returns entity when model.findOne resolves', async () => {
    const helper = createHelper();
    const entity = { id: 'test-1', name: 'Alpha' } as TestEntity;
    jest.spyOn(TestEntity, 'findOne').mockResolvedValue(entity);

    await expect(helper.findById('test-1')).resolves.toEqual(entity);
  });

  it('findById wraps repository failures', async () => {
    const helper = createHelper();
    jest.spyOn(TestEntity, 'findOne').mockRejectedValue(new Error('boom'));

    await expect(helper.findById('test-1')).rejects.toThrow(
      'Failed to retrieve TestEntity with ID test-1',
    );
  });

  it('findByField returns null when model.findOne returns null', async () => {
    const helper = createHelper();
    jest.spyOn(TestEntity, 'findOne').mockResolvedValue(null);

    await expect(helper.findByField('name', 'missing')).resolves.toBeNull();
  });

  it('findByField wraps repository failures', async () => {
    const helper = createHelper();
    jest.spyOn(TestEntity, 'findOne').mockRejectedValue(new Error('boom'));

    await expect(helper.findByField('name', 'missing')).rejects.toThrow(
      'Failed to retrieve TestEntity by name',
    );
  });

  it('findManyByField returns all entities from model.find', async () => {
    const helper = createHelper();
    const entities = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
    ] as TestEntity[];
    jest.spyOn(TestEntity, 'find').mockResolvedValue(entities);

    await expect(helper.findManyByField('name', 'A')).resolves.toEqual(entities);
  });

  it('findManyByField wraps repository failures', async () => {
    const helper = createHelper();
    jest.spyOn(TestEntity, 'find').mockRejectedValue(new Error('boom'));

    await expect(helper.findManyByField('name', 'A')).rejects.toThrow(
      'Failed to retrieve TestEntity by name',
    );
  });

  it('create returns existing entity when checkExisting hits by id', async () => {
    const helper = createHelper();
    const existing = { id: 'same-id', name: 'Existing' } as TestEntity;
    jest.spyOn(TestEntity, 'findOne').mockResolvedValue(existing);

    await expect(helper.create({ id: 'same-id', name: 'New' })).resolves.toEqual(existing);
  });

  it('create builds and saves a new entity when no existing row is found', async () => {
    const helper = createHelper();
    const created = {
      id: 'new-id',
      name: 'Created',
      save: jest.fn().mockResolvedValue(undefined),
    } as unknown as TestEntity;

    jest.spyOn(TestEntity, 'findOne').mockResolvedValue(null);
    jest.spyOn(TestEntity, 'create').mockReturnValue(created);

    const result = await helper.create({ name: 'Created' });

    expect((created as unknown as { save: jest.Mock }).save).toHaveBeenCalled();
    expect(result).toBe(created);
  });

  it('create skips duplicate lookup when checkExisting is disabled', async () => {
    const helper = createHelper();
    const findByIdSpy = jest.spyOn(helper, 'findById');
    const created = {
      id: 'forced-id',
      name: 'Created',
      save: jest.fn().mockResolvedValue(undefined),
    } as unknown as TestEntity;

    jest.spyOn(TestEntity, 'create').mockReturnValue(created);

    const result = await helper.create({ id: 'forced-id', name: 'Created' }, false);

    expect(findByIdSpy).not.toHaveBeenCalled();
    expect(result).toBe(created);
  });

  it('create generates a full UUID when short IDs are disabled', async () => {
    const helper = createFullIdHelper();
    const createSpy = jest.spyOn(TestEntity, 'create');
    const save = jest.fn().mockResolvedValue(undefined);

    createSpy.mockImplementation(
      (payload) => ({ ...(payload as object), save }) as unknown as TestEntity,
    );

    await helper.create({ name: 'Created' });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: expect.stringMatching(/-/) }),
    );
  });

  it('create maps duplicate database errors to a friendly message', async () => {
    const helper = createHelper();
    const duplicateError = { code: '23505', message: 'unique violation' };

    jest.spyOn(TestEntity, 'findOne').mockResolvedValue(null);
    jest.spyOn(TestEntity, 'create').mockImplementation(() => {
      throw duplicateError;
    });

    await expect(helper.create({ name: 'Created' })).rejects.toThrow('TestEntity already exists.');
  });

  it('create maps unique-message errors even without a postgres code', async () => {
    const helper = createHelper();

    jest.spyOn(TestEntity, 'findOne').mockResolvedValue(null);
    jest.spyOn(TestEntity, 'create').mockImplementation(() => {
      throw new Error('unique constraint failed');
    });

    await expect(helper.create({ name: 'Created' })).rejects.toThrow('TestEntity already exists.');
  });

  it('create wraps unexpected database errors', async () => {
    const helper = createHelper();

    jest.spyOn(TestEntity, 'findOne').mockResolvedValue(null);
    jest.spyOn(TestEntity, 'create').mockImplementation(() => {
      throw new Error('boom');
    });

    await expect(helper.create({ name: 'Created' })).rejects.toThrow('Failed to create TestEntity');
  });

  it('createWithRelation delegates to create with the relation field', async () => {
    const helper = createHelper();
    const createSpy = jest
      .spyOn(helper, 'create')
      .mockResolvedValue({ id: 'test-1', name: 'Created' } as TestEntity);

    await expect(
      helper.createWithRelation({ name: 'Created' }, 'libraryId', 'library-1', false),
    ).resolves.toEqual({
      id: 'test-1',
      name: 'Created',
    });

    expect(createSpy).toHaveBeenCalledWith({ name: 'Created', libraryId: 'library-1' }, false);
  });

  it('update preloads and saves entity', async () => {
    const helper = createHelper();
    const saved = {
      id: 'id-1',
      name: 'Updated',
      save: jest.fn().mockResolvedValue({ id: 'id-1', name: 'Updated' }),
    };
    const preload = jest.fn().mockResolvedValue(saved);
    const getRepository = jest.spyOn(TestEntity, 'getRepository').mockReturnValue({
      metadata: {
        columns: [],
        relations: [],
      },
      preload,
    } as never);

    const result = await helper.update('id-1', { name: 'Updated' });

    expect(getRepository).toHaveBeenCalled();
    expect(preload).toHaveBeenCalled();
    expect(result).toEqual({ id: 'id-1', name: 'Updated' });
  });

  it('update strips relations and reapplies simple-json fields before saving', async () => {
    const helper = createHelper();
    const preloaded = {
      id: 'id-1',
      metadata: undefined,
      save: jest.fn().mockResolvedValue({ id: 'id-1', metadata: { nested: true } }),
    };
    const preload = jest.fn().mockResolvedValue(preloaded);

    jest.spyOn(TestEntity, 'getRepository').mockReturnValue({
      metadata: {
        columns: [{ type: 'simple-json', propertyName: 'metadata' }],
        relations: [{ propertyName: 'library' }],
      },
      preload,
    } as never);

    await helper.update('id-1', {
      name: 'Updated',
      metadata: { nested: true },
      library: { id: 'library-1' },
    } as unknown as Partial<TestEntity>);

    expect(preload).toHaveBeenCalledWith({ id: 'id-1', name: 'Updated' });
    expect(preloaded.save).toHaveBeenCalled();
    expect(preloaded.metadata).toEqual({ nested: true });
  });

  it('update wraps missing preload results', async () => {
    const helper = createHelper();
    jest.spyOn(TestEntity, 'getRepository').mockReturnValue({
      metadata: { columns: [], relations: [] },
      preload: jest.fn().mockResolvedValue(null),
    } as never);

    await expect(helper.update('id-1', { name: 'Updated' })).rejects.toThrow(
      'Failed to update TestEntity with ID id-1',
    );
  });

  it('delete resolves when model.delete affects rows', async () => {
    const helper = createHelper();
    jest.spyOn(TestEntity, 'delete').mockResolvedValue({ affected: 1 } as never);

    await expect(helper.delete('id-1')).resolves.toBeUndefined();
  });

  it('delete preserves not-found errors', async () => {
    const helper = createHelper();
    jest.spyOn(TestEntity, 'delete').mockResolvedValue({ affected: 0 } as never);

    await expect(helper.delete('id-1')).rejects.toThrow('TestEntity with ID id-1 not found');
  });

  it('delete wraps unexpected errors', async () => {
    const helper = createHelper();
    jest.spyOn(TestEntity, 'delete').mockRejectedValue(new Error('boom'));

    await expect(helper.delete('id-1')).rejects.toThrow('Failed to delete TestEntity with ID id-1');
  });

  it('findAll returns entities from model.find', async () => {
    const helper = createHelper();
    const entities = [{ id: '1', name: 'A' }] as TestEntity[];
    jest.spyOn(TestEntity, 'find').mockResolvedValue(entities);

    await expect(helper.findAll()).resolves.toEqual(entities);
  });

  it('findAll wraps repository failures', async () => {
    const helper = createHelper();
    jest.spyOn(TestEntity, 'find').mockRejectedValue(new Error('boom'));

    await expect(helper.findAll()).rejects.toThrow('Failed to retrieve all TestEntity');
  });

  it('createRelationship returns the existing relation when found', async () => {
    const helper = createHelper();
    const relationModel = TestEntity as typeof BaseEntity & (new () => TestEntity);
    const existing = { id: 'rel-1', name: 'Existing' } as TestEntity;

    jest.spyOn(relationModel, 'findOne').mockResolvedValue(existing);

    await expect(
      helper.createRelationship(relationModel, {
        name: 'Existing',
      } as Partial<TestEntity>),
    ).resolves.toBe(existing);
  });

  it('createRelationship creates and saves a new relation when none exists', async () => {
    const helper = createHelper();
    const relationModel = TestEntity as typeof BaseEntity & (new () => TestEntity);
    const created = {
      id: 'rel-2',
      name: 'Created',
      save: jest.fn().mockResolvedValue(undefined),
    } as unknown as TestEntity;

    jest.spyOn(relationModel, 'findOne').mockResolvedValue(null);
    jest.spyOn(relationModel, 'create').mockReturnValue(created);

    const result = await helper.createRelationship(relationModel, {
      name: 'Created',
    } as Partial<TestEntity>);

    expect((created as unknown as { save: jest.Mock }).save).toHaveBeenCalled();
    expect(result).toBe(created);
  });

  it('createRelationship skips existing lookup when disabled', async () => {
    const helper = createHelper();
    const relationModel = TestEntity as typeof BaseEntity & (new () => TestEntity);
    const created = {
      id: 'rel-3',
      name: 'Created',
      save: jest.fn().mockResolvedValue(undefined),
    } as unknown as TestEntity;
    const findOneSpy = jest.spyOn(relationModel, 'findOne');

    jest.spyOn(relationModel, 'create').mockReturnValue(created);

    await expect(
      helper.createRelationship(relationModel, { name: 'Created' } as Partial<TestEntity>, false),
    ).resolves.toBe(created);
    expect(findOneSpy).not.toHaveBeenCalled();
  });

  it('createRelationship wraps persistence errors', async () => {
    const helper = createHelper();
    const relationModel = TestEntity as typeof BaseEntity & (new () => TestEntity);

    jest.spyOn(relationModel, 'findOne').mockRejectedValue(new Error('boom'));

    await expect(
      helper.createRelationship(relationModel, {
        name: 'Broken',
      } as Partial<TestEntity>),
    ).rejects.toThrow('Failed to create TestEntity relationship');
  });

  it('deleteRelationship deletes relation rows and wraps errors', async () => {
    const helper = createHelper();
    const relationModel = TestEntity as typeof BaseEntity & (new () => TestEntity);
    const deleteSpy = jest
      .spyOn(relationModel, 'delete')
      .mockResolvedValue({ affected: 1 } as never);

    await expect(
      helper.deleteRelationship(relationModel, {
        id: 'rel-1',
      } as Partial<TestEntity>),
    ).resolves.toBeUndefined();
    expect(deleteSpy).toHaveBeenCalledWith({ id: 'rel-1' });

    deleteSpy.mockRejectedValueOnce(new Error('boom'));

    await expect(
      helper.deleteRelationship(relationModel, {
        id: 'rel-1',
      } as Partial<TestEntity>),
    ).rejects.toThrow('Failed to delete TestEntity relationship');
  });
});
