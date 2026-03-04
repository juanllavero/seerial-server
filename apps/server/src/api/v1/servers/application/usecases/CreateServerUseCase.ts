import { Server } from "../../domain/Server";
import { ServersRepositoryPort } from "../ports/ServersRepositoryPort";

export class CreateServerUseCase {
  constructor(private serversRepo: ServersRepositoryPort) {}

  async execute(data: Server): Promise<Server | null> {
    return this.serversRepo.create(data);
  }
}
