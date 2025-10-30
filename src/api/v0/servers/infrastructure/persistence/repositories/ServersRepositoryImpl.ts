import { BaseRepository } from "@/api/v0/base-repository/BaseRepository";
import { v4 as uuidv4 } from "uuid";
import { ServersRepositoryPort } from "../../../application/ports/ServersRepositoryPort";
import { Server } from "../../../domain/Server";
import { ServerModel } from "../models/ServerModel";

export class ServersRepositoryImpl
  extends BaseRepository
  implements ServersRepositoryPort
{
  async getServerConfig(): Promise<Server | null> {
    return this.handleRepositoryError(async () => {
      const server = await ServerModel.findOne();

      return server ? server.toJSON() : null;
    }, `Failed to retrieve server config`);
  }

  async create(server: Server): Promise<Server | null> {
    this.validateData(server, "Server data");

    return await this.handleRepositoryError(async () => {
      // Check if server already exists by ID
      if (server.id) {
        const existingServer = await ServerModel.findByPk(server.id);
        if (existingServer) {
          console.log(`Server with ID ${server.id} already exists`);
          return existingServer;
        }
      }

      // Generate UUID if it doesn't exist
      const dataToCreate = {
        ...server,
        id: server.id || uuidv4().split("-")[0],
      };

      const createdServer = await ServerModel.create(dataToCreate as any);
      return createdServer ? createdServer.toJSON() : null;
    }, "Failed to create server");
  }

  async update(id: string, data: Partial<Server>): Promise<Server> {
    const validatedId = this.validateId(id, "Server ID");
    this.validateData(data, "Update data");

    return this.handleRepositoryError(async () => {
      const [affectedCount] = await ServerModel.update(data as any, {
        where: { id: validatedId },
      });

      this.ensureAffected(affectedCount, `Server with ID ${id} not found`);

      const updatedServer = await ServerModel.findByPk(id);
      if (!updatedServer) {
        throw new Error(`Failed to retrieve updated album with ID ${id}`);
      }

      return updatedServer.toJSON();
    }, `Failed to update album with ID ${id}`);
  }
}
