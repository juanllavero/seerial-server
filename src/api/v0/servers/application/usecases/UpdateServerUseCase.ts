import { Server } from "../../domain/Server";
import { ServersRepositoryPort } from "../ports/ServersRepositoryPort";

export class UpdateServerUseCase {
  constructor(private serversRepo: ServersRepositoryPort) {}

  async execute(id: string, data: Partial<Server>): Promise<Server> {
    return this.serversRepo.update(id, data);
  }
}
