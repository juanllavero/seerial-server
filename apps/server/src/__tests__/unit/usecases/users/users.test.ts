import type { User } from '@seerial/domain';
import { buildAdminUser, buildUser } from '@/__tests__/helpers/mock-factories';
import type { UsersRepositoryPort } from '@/api/v1/users/application/ports/UsersRepositoryPort';
import { AuthenticateUserUseCase } from '@/api/v1/users/application/usecases/AuthenticateUserUseCase';
import { CreateUserUseCase } from '@/api/v1/users/application/usecases/CreateUserUseCase';
import { DeleteUserUseCase } from '@/api/v1/users/application/usecases/DeleteUserUseCase';
import { GetAllUsersUseCase } from '@/api/v1/users/application/usecases/GetAllUsersUseCase';
import { UpdateUserUseCase } from '@/api/v1/users/application/usecases/UpdateUserUseCase';

function buildMockRepo(overrides: Partial<UsersRepositoryPort> = {}): UsersRepositoryPort {
  return {
    findAll: jest.fn(),
    authenticate: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  };
}

describe('User use cases', () => {
  describe('AuthenticateUserUseCase', () => {
    it('delegates to usersRepo.authenticate and returns the result', async () => {
      const token = 'signed-jwt';
      const user = buildUser();
      const repo = buildMockRepo({
        authenticate: jest.fn().mockResolvedValue({ token, user }),
      });

      const useCase = new AuthenticateUserUseCase(repo);
      const result = await useCase.execute('testuser', 'password');

      expect(repo.authenticate).toHaveBeenCalledWith('testuser', 'password');
      expect(result).toEqual({ token, user });
    });

    it('returns null when credentials do not match', async () => {
      const repo = buildMockRepo({
        authenticate: jest.fn().mockResolvedValue(null),
      });

      const useCase = new AuthenticateUserUseCase(repo);
      const result = await useCase.execute('testuser', 'wrong-password');

      expect(result).toBeNull();
    });

    it('allows null password for password-free users', async () => {
      const user = buildUser();
      const repo = buildMockRepo({
        authenticate: jest.fn().mockResolvedValue({ token: 'token', user }),
      });

      const useCase = new AuthenticateUserUseCase(repo);
      await useCase.execute('testuser', null);

      expect(repo.authenticate).toHaveBeenCalledWith('testuser', null);
    });
  });

  describe('CreateUserUseCase', () => {
    it('delegates to usersRepo.create and returns the new user', async () => {
      const newUser = buildUser();
      const repo = buildMockRepo({
        create: jest.fn().mockResolvedValue(newUser),
      });

      const useCase = new CreateUserUseCase(repo);
      const result = await useCase.execute({ username: 'testuser' });

      expect(repo.create).toHaveBeenCalledWith({ username: 'testuser' });
      expect(result).toEqual(newUser);
    });

    it('propagates errors from the repository', async () => {
      const repo = buildMockRepo({
        create: jest.fn().mockRejectedValue(new Error('User already exists')),
      });

      const useCase = new CreateUserUseCase(repo);
      await expect(useCase.execute({ username: 'duplicate' })).rejects.toThrow(
        'User already exists',
      );
    });
  });

  describe('UpdateUserUseCase', () => {
    it('calls update with id and data and returns updated user', async () => {
      const updated = buildUser({ username: 'updated' });
      const repo = buildMockRepo({
        update: jest.fn().mockResolvedValue(updated),
      });

      const useCase = new UpdateUserUseCase(repo);
      const result = await useCase.execute('user-1', { username: 'updated' });

      expect(repo.update).toHaveBeenCalledWith('user-1', { username: 'updated' });
      expect(result).toEqual(updated);
    });

    it('propagates not-found errors from the repository', async () => {
      const repo = buildMockRepo({
        update: jest.fn().mockRejectedValue(new Error('User not found')),
      });

      const useCase = new UpdateUserUseCase(repo);
      await expect(useCase.execute('nonexistent', { username: 'x' })).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('DeleteUserUseCase', () => {
    it('calls delete with the given id', async () => {
      const repo = buildMockRepo({
        delete: jest.fn().mockResolvedValue(undefined),
      });

      const useCase = new DeleteUserUseCase(repo);
      await useCase.execute('user-1');

      expect(repo.delete).toHaveBeenCalledWith('user-1');
    });

    it('propagates errors from the repository', async () => {
      const repo = buildMockRepo({
        delete: jest.fn().mockRejectedValue(new Error('User not found')),
      });

      const useCase = new DeleteUserUseCase(repo);
      await expect(useCase.execute('nonexistent')).rejects.toThrow('User not found');
    });
  });

  describe('GetAllUsersUseCase', () => {
    it('returns all users from the repository', async () => {
      const users: User[] = [buildUser(), buildAdminUser()];
      const repo = buildMockRepo({
        findAll: jest.fn().mockResolvedValue(users),
      });

      const useCase = new GetAllUsersUseCase(repo);
      const result = await useCase.execute();

      expect(result).toEqual(users);
      expect(repo.findAll).toHaveBeenCalledTimes(1);
    });

    it('returns an empty array when there are no users', async () => {
      const repo = buildMockRepo({
        findAll: jest.fn().mockResolvedValue([]),
      });

      const useCase = new GetAllUsersUseCase(repo);
      const result = await useCase.execute();

      expect(result).toEqual([]);
    });
  });
});
