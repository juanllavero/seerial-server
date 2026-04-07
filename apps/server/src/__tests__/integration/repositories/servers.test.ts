import 'reflect-metadata';
import { ServersRepositoryImpl } from '@/api/v1/servers/infrastructure/persistence/repositories/ServersRepositoryImpl';
import { clearAllTables, closeTestDataSource, getTestDataSource } from '../../helpers/test-db';

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
    useCases: {},
    fileSystemService: { getExternalPath: jest.fn().mockReturnValue('/test') },
}));

let repo: ServersRepositoryImpl;

beforeAll(async () => {
    await getTestDataSource();
    repo = new ServersRepositoryImpl();
});

afterAll(async () => {
    await closeTestDataSource();
});

beforeEach(async () => {
    const ds = await getTestDataSource();
    await clearAllTables(ds);
});

function buildServerData(overrides: Record<string, unknown> = {}) {
    return {
        name: 'My Server',
        httpPort: 34200,
        httpsPort: 34400,
        tunnelEnabled: false,
        httpsEnabled: false,
        ...overrides,
    } as never;
}

describe('ServersRepositoryImpl', () => {
    describe('getServerConfig', () => {
        it('returns null when no server config exists', async () => {
            const config = await repo.getServerConfig();
            expect(config).toBeNull();
        });

        it('returns the server config after creation', async () => {
            await repo.create(buildServerData({ name: 'Home Server' }));

            const config = await repo.getServerConfig();

            expect(config).not.toBeNull();
            expect(config!.name).toBe('Home Server');
        });
    });

    describe('create', () => {
        it('creates a server with a generated id', async () => {
            const server = await repo.create(buildServerData());

            expect(server).not.toBeNull();
            expect(server!.id).toBeTruthy();
            expect(server!.name).toBe('My Server');
            expect(server!.httpPort).toBe(34200);
        });

        it('returns the existing server when created with the same id', async () => {
            const first = await repo.create(buildServerData({ name: 'First' }));
            const second = await repo.create(buildServerData({ id: first!.id, name: 'Second' }));

            expect(second!.id).toBe(first!.id);
            expect(second!.name).toBe('First');
        });

        it('stores custom port configuration', async () => {
            const server = await repo.create(buildServerData({ httpPort: 8080, httpsPort: 8443 }));

            expect(server!.httpPort).toBe(8080);
            expect(server!.httpsPort).toBe(8443);
        });
    });

    describe('update', () => {
        it('updates the server name', async () => {
            const server = await repo.create(buildServerData({ name: 'Old Name' }));

            const updated = await repo.update(server!.id, { name: 'New Name' });

            expect(updated.name).toBe('New Name');
        });

        it('updates the http port', async () => {
            const server = await repo.create(buildServerData());

            const updated = await repo.update(server!.id, { httpPort: 9000 });

            expect(updated.httpPort).toBe(9000);
        });

        it('throws for an empty id', async () => {
            await expect(repo.update('', { name: 'x' })).rejects.toMatchObject({ statusCode: 400 });
        });

        it('throws for null update data', async () => {
            const server = await repo.create(buildServerData());
            await expect(repo.update(server!.id, null as never)).rejects.toMatchObject({ statusCode: 400 });
        });
    });
});
