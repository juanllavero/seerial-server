import type { ServersRepositoryPort } from '@/api/v1/servers/application/ports/ServersRepositoryPort';
import { CreateServerUseCase } from '@/api/v1/servers/application/usecases/CreateServerUseCase';
import { GetServerUseCase } from '@/api/v1/servers/application/usecases/GetServerUseCase';
import { UpdateServerUseCase } from '@/api/v1/servers/application/usecases/UpdateServerUseCase';
import type { Server } from '@/api/v1/servers/domain/Server';

function buildServer(overrides: Partial<Server> = {}): Server {
  return {
    id: 'server-1',
    name: 'Seerial Server',
    httpPort: 34200,
    httpsPort: 34400,
    httpsEnabled: false,
    ...overrides,
  } as Server;
}

function buildServersRepo(overrides: Partial<ServersRepositoryPort> = {}): ServersRepositoryPort {
  return {
    getServerConfig: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    ...overrides,
  };
}

describe('Server use cases', () => {
  describe('CreateServerUseCase', () => {
    it('creates a server config through the repository', async () => {
      const server = buildServer();
      const repo = buildServersRepo({ create: jest.fn().mockResolvedValue(server) });

      const result = await new CreateServerUseCase(repo).execute(server);

      expect(result).toEqual(server);
      expect(repo.create).toHaveBeenCalledWith(server);
    });

    it('returns null when no server config is created', async () => {
      const repo = buildServersRepo({ create: jest.fn().mockResolvedValue(null) });

      await expect(new CreateServerUseCase(repo).execute(buildServer())).resolves.toBeNull();
    });
  });

  describe('GetServerUseCase', () => {
    it('returns the current server config', async () => {
      const server = buildServer();
      const repo = buildServersRepo({ getServerConfig: jest.fn().mockResolvedValue(server) });

      const result = await new GetServerUseCase(repo).execute();

      expect(result).toEqual(server);
      expect(repo.getServerConfig).toHaveBeenCalledTimes(1);
    });

    it('returns null when no server config exists yet', async () => {
      const repo = buildServersRepo({ getServerConfig: jest.fn().mockResolvedValue(null) });

      await expect(new GetServerUseCase(repo).execute()).resolves.toBeNull();
    });
  });

  describe('UpdateServerUseCase', () => {
    it('updates the server config through the repository', async () => {
      const server = buildServer({ name: 'Updated Server' });
      const repo = buildServersRepo({ update: jest.fn().mockResolvedValue(server) });

      const result = await new UpdateServerUseCase(repo).execute('server-1', {
        name: 'Updated Server',
      });

      expect(result).toEqual(server);
      expect(repo.update).toHaveBeenCalledWith('server-1', {
        name: 'Updated Server',
      });
    });
  });
});
