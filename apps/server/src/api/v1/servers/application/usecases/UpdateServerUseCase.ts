import type { Server } from "../../domain/Server";
import type { ServersRepositoryPort } from "../ports/ServersRepositoryPort";

export class UpdateServerUseCase {
	constructor(private serversRepo: ServersRepositoryPort) {}

	async execute(id: string, data: Partial<Server>): Promise<Server> {
		return this.serversRepo.update(id, data);
	}
}
