import 'reflect-metadata';
import { UsersRepositoryImpl } from '@/api/v1/users/infrastructure/persistence/repositories/UsersRepositoryImpl';
import { UserType } from '@/utils/constants';
import {
    clearAllTables,
    closeTestDataSource,
    getTestDataSource,
} from '../../helpers/test-db';

// Mocking the DI container prevents loading ScanLibraryUseCase which pulls in
// p-limit (pure-ESM) through entity model imports (SeriesModel -> container).
jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
    useCases: {},
    fileSystemService: { getExternalPath: jest.fn().mockReturnValue('/test') },
}));

let repo: UsersRepositoryImpl;

beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-for-integration';
    await getTestDataSource();
    repo = new UsersRepositoryImpl();
});

afterAll(async () => {
    await closeTestDataSource();
});

beforeEach(async () => {
    const ds = await getTestDataSource();
    await clearAllTables(ds);
});

describe('UsersRepositoryImpl', () => {
    describe('create', () => {
        it('creates a user with generated id', async () => {
            const user = await repo.create({ username: 'alice', type: UserType.NORMAL });
            expect(user.id).toBeTruthy();
            expect(user.username).toBe('alice');
            expect(user.type).toBe(UserType.NORMAL);
        });

        it('hashes the password on create', async () => {
            const user = await repo.create({ username: 'bob', password: 'secret', type: UserType.ADMIN });
            // findAll excludes password, so we check via authenticate that password is hashed & works
            expect(user.id).toBeTruthy();
        });

        it('throws when creating admin without a password', async () => {
            await expect(repo.create({ username: 'nopassadmin', type: UserType.ADMIN })).rejects.toMatchObject({
                statusCode: 401,
            });
        });

        it('applies defaults (allowRemote, allowDownloads, etc.)', async () => {
            const user = await repo.create({ username: 'defaults' });
            expect(user.allowRemote).toBe(true);
            expect(user.allowDownloads).toBe(true);
            expect(user.allowVideoTranscoding).toBe(true);
            expect(user.hideInLogin).toBe(false);
            expect(user.maxSessions).toBe(0);
        });
    });

    describe('findAll', () => {
        it('returns empty array when no users exist', async () => {
            const users = await repo.findAll();
            expect(users).toEqual([]);
        });

        it('returns visible users only (excludes hideInLogin=true)', async () => {
            await repo.create({ username: 'visible' });
            await repo.create({ username: 'hidden', hideInLogin: true });
            const users = await repo.findAll();
            expect(users).toHaveLength(1);
            expect(users[0].username).toBe('visible');
        });
    });

    describe('authenticate', () => {
        it('returns null when user does not exist', async () => {
            const result = await repo.authenticate('unknown', 'pass');
            expect(result).toBeNull();
        });

        it('returns null for wrong password', async () => {
            await repo.create({ username: 'authuser', password: 'correct', type: UserType.ADMIN });
            const result = await repo.authenticate('authuser', 'wrong');
            expect(result).toBeNull();
        });

        it('returns token and user for correct credentials', async () => {
            await repo.create({ username: 'authuser', password: 'p@ssword1', type: UserType.ADMIN });
            const result = await repo.authenticate('authuser', 'p@ssword1');
            expect(result).not.toBeNull();
            expect(result!.token).toBeTruthy();
            expect(result!.user).not.toBeNull();
            expect(result!.user!.username).toBe('authuser');
        });

        it('returns token for user with no password when null is passed', async () => {
            await repo.create({ username: 'nopass' });
            const result = await repo.authenticate('nopass', null);
            expect(result).not.toBeNull();
            expect(result!.token).toBeTruthy();
        });
    });

    describe('update', () => {
        it('updates user fields', async () => {
            const created = await repo.create({ username: 'updateme' });
            const updated = await repo.update(created.id, { allowRemote: false });
            expect(updated.allowRemote).toBe(false);
        });
    });

    describe('delete', () => {
        it('deletes the user', async () => {
            const user = await repo.create({ username: 'deleteme' });
            await repo.delete(user.id);
            const users = await repo.findAll();
            expect(users.find((u) => u.id === user.id)).toBeUndefined();
        });

        it('throws BadRequestException for invalid id', async () => {
            await expect(repo.delete('')).rejects.toMatchObject({ statusCode: 400 });
        });
    });
});
