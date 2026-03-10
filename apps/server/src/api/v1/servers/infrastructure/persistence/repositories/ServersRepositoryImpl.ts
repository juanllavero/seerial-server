import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from '@/api/v1/base-repository/BaseRepository';
import { GenericRepositoryHelper } from '@/helpers/GenericRepositoryHelper';
import logger from '@/utils/logger';
import type { ServersRepositoryPort } from '../../../application/ports/ServersRepositoryPort';
import type { Server } from '../../../domain/Server';
import { ServerModel } from '../models/ServerModel';

/**
 * Implementation of ServersRepositoryPort for server configuration management.
 * Provides CRUD operations for server entities using Sequelize ORM.
 */
export class ServersRepositoryImpl extends BaseRepository implements ServersRepositoryPort {
  /** Helper for common CRUD operations on ServerModel */
  private helper: GenericRepositoryHelper<ServerModel, Server>;

  /**
   * Creates a new ServersRepositoryImpl instance.
   * Initializes the generic repository helper with ServerModel configuration.
   */
  constructor() {
    super();
    this.helper = new GenericRepositoryHelper(ServerModel, {
      entityName: 'Server',
      generateShortId: true,
    });
  }

  /**
   * Retrieves the server configuration.
   * Returns the first server record or null if no servers exist.
   *
   * @returns Promise resolving to a Server instance or null
   */
  async getServerConfig(): Promise<Server | null> {
    return this.helper.findAll().then((servers) => servers[0] || null);
  }

  /**
   * Creates a new server or returns existing server if ID already exists.
   * Validates input data and generates a UUID if no ID is provided.
   *
   * @param server - Server data to create
   * @returns Promise resolving to the created Server instance or null
   */
  async create(server: Server): Promise<Server | null> {
    this.validateData(server, 'Server data');

    if (server.id) {
      const existingServer = await ServerModel.findOne({
        where: { id: server.id },
      });
      if (existingServer) {
        logger.info(`Server with ID ${server.id} already exists`);
        return existingServer as unknown as Server;
      }
    }

    const dataToCreate = {
      ...server,
      id: server.id || uuidv4().split('-')[0],
    };

    return this.helper.create(dataToCreate, true);
  }

  /**
   * Updates an existing server with new data.
   * Validates the server ID and update data before performing the update.
   *
   * @param id - The ID of the server to update
   * @param data - Partial server data containing fields to update
   * @returns Promise resolving to the updated Server instance
   */
  async update(id: string, data: Partial<Server>): Promise<Server> {
    const validatedId = this.validateId(id, 'Server ID');
    this.validateData(data, 'Update data');
    return this.helper.update(validatedId, data);
  }
}
