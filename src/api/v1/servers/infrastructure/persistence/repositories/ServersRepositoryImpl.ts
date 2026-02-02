import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import logger from "@/utils/logger";
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

      return server ? (server as unknown as Server) : null;
    }, `Failed to retrieve server config`);
  }

  async create(server: Server): Promise<Server | null> {
    this.validateData(server, "Server data");

    return await this.handleRepositoryError(async () => {
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

      const createdServer = ServerModel.create(dataToCreate);
      await createdServer.save();
      return createdServer as unknown as Server;
    }, "Failed to create server");
  }

  async update(id: string, data: Partial<Server>): Promise<Server> {
    const validatedId = this.validateId(id, "Server ID");
    this.validateData(data, "Update data");

    return this.handleRepositoryError(async () => {
      const result = await ServerModel.update({ id: validatedId }, data);

      this.ensureAffected(
        result.affected || 0,
        `Server with ID ${id} not found`
      );

      const updatedServer = await ServerModel.findOne({
        where: { id: validatedId },
      });
      if (!updatedServer) {
        throw new Error(`Failed to retrieve updated server with ID ${id}`);
      }

      return updatedServer as unknown as Server;
    }, `Failed to update server with ID ${id}`);
  }
}
