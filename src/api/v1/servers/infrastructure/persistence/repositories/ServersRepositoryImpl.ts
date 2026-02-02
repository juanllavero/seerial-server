import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import { GenericRepositoryHelper } from "@/helpers/GenericRepositoryHelper";
import logger from "@/utils/logger";
import { v4 as uuidv4 } from "uuid";
import { ServersRepositoryPort } from "../../../application/ports/ServersRepositoryPort";
import { Server } from "../../../domain/Server";
import { ServerModel } from "../models/ServerModel";

export class ServersRepositoryImpl
  extends BaseRepository
  implements ServersRepositoryPort
{
  // Generic helper for common CRUD operations
  private helper: GenericRepositoryHelper<ServerModel, Server>;

  constructor() {
    super();

    // Initialize helper
    this.helper = new GenericRepositoryHelper(ServerModel, {
      entityName: "Server",
      generateShortId: true,
    });
  }

  async getServerConfig(): Promise<Server | null> {
    return this.helper.findAll().then((servers) => servers[0] || null);
  }

  async create(server: Server): Promise<Server | null> {
    this.validateData(server, "Server data");

    // Check if server already exists by ID
    if (server.id) {
      const existingServer = await ServerModel.findOne({
        where: { id: server.id },
      });
      if (existingServer) {
        logger.info(`Server with ID ${server.id} already exists`);
        return existingServer as unknown as Server;
      }
    }

    // Generate UUID if it doesn't exist
    const dataToCreate = {
      ...server,
      id: server.id || uuidv4().split("-")[0],
    };

    return this.helper.create(dataToCreate, true);
  }

  async update(id: string, data: Partial<Server>): Promise<Server> {
    const validatedId = this.validateId(id, "Server ID");
    this.validateData(data, "Update data");
    return this.helper.update(validatedId, data);
  }
}
