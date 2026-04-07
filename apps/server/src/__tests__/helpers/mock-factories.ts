import type { User } from '@seerial/domain';
import type { UserType } from '@/utils/constants';

export function buildUser(overrides: Partial<User> = {}): User {
    return {
        id: 'test-user-1',
        username: 'testuser',
        password: undefined,
        avatar: undefined,
        allowRemote: true,
        type: 'normal' as UserType,
        allowVideoTranscoding: true,
        internetBitrateLimit: undefined,
        allowDownloads: true,
        hideInLogin: false,
        maxSessions: 0,
        libraries: [],
        ...overrides,
    };
}

export function buildAdminUser(overrides: Partial<User> = {}): User {
    return buildUser({
        id: 'test-admin-1',
        username: 'adminuser',
        type: 'admin' as UserType,
        ...overrides,
    });
}
