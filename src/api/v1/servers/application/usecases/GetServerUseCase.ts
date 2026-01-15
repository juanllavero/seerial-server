import { Server } from "../../domain/Server";
import { ServersRepositoryPort } from "../ports/ServersRepositoryPort";

export class GetServerUseCase {
  constructor(private serversRepo: ServersRepositoryPort) {}

  async execute(): Promise<Server | null> {
    return this.serversRepo.getServerConfig();
  }
}
