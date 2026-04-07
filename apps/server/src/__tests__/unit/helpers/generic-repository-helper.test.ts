import { BaseEntity } from 'typeorm';
import { GenericRepositoryHelper } from '@/helpers/GenericRepositoryHelper';

class TestEntity extends BaseEntity {
    id!: string;
    name!: string;
}

describe('GenericRepositoryHelper', () => {
    const createHelper = () =>
        new GenericRepositoryHelper<TestEntity, TestEntity>(TestEntity as typeof BaseEntity & (new () => TestEntity), {
            entityName: 'TestEntity',
            generateShortId: true,
        });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('findById returns entity when model.findOne resolves', async () => {
        const helper = createHelper();
        const entity = { id: 'test-1', name: 'Alpha' } as TestEntity;
        jest.spyOn(TestEntity, 'findOne').mockResolvedValue(entity);

        await expect(helper.findById('test-1')).resolves.toEqual(entity);
    });

    it('findByField returns null when model.findOne returns null', async () => {
        const helper = createHelper();
        jest.spyOn(TestEntity, 'findOne').mockResolvedValue(null);

        await expect(helper.findByField('name', 'missing')).resolves.toBeNull();
    });

    it('findManyByField returns all entities from model.find', async () => {
        const helper = createHelper();
        const entities = [{ id: '1', name: 'A' }, { id: '2', name: 'B' }] as TestEntity[];
        jest.spyOn(TestEntity, 'find').mockResolvedValue(entities);

        await expect(helper.findManyByField('name', 'A')).resolves.toEqual(entities);
    });

    it('create returns existing entity when checkExisting hits by id', async () => {
        const helper = createHelper();
        const existing = { id: 'same-id', name: 'Existing' } as TestEntity;
        jest.spyOn(TestEntity, 'findOne').mockResolvedValue(existing);

        await expect(helper.create({ id: 'same-id', name: 'New' })).resolves.toEqual(existing);
    });

    it('create builds and saves a new entity when no existing row is found', async () => {
        const helper = createHelper();
        const created = { id: 'new-id', name: 'Created', save: jest.fn().mockResolvedValue(undefined) } as unknown as TestEntity;

        jest.spyOn(TestEntity, 'findOne').mockResolvedValue(null);
        jest.spyOn(TestEntity, 'create').mockReturnValue(created);

        const result = await helper.create({ name: 'Created' });

        expect((created as unknown as { save: jest.Mock }).save).toHaveBeenCalled();
        expect(result).toBe(created);
    });

    it('update preloads and saves entity', async () => {
        const helper = createHelper();
        const saved = { id: 'id-1', name: 'Updated', save: jest.fn().mockResolvedValue({ id: 'id-1', name: 'Updated' }) };
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

    it('delete resolves when model.delete affects rows', async () => {
        const helper = createHelper();
        jest.spyOn(TestEntity, 'delete').mockResolvedValue({ affected: 1 } as never);

        await expect(helper.delete('id-1')).resolves.toBeUndefined();
    });

    it('findAll returns entities from model.find', async () => {
        const helper = createHelper();
        const entities = [{ id: '1', name: 'A' }] as TestEntity[];
        jest.spyOn(TestEntity, 'find').mockResolvedValue(entities);

        await expect(helper.findAll()).resolves.toEqual(entities);
    });
});
