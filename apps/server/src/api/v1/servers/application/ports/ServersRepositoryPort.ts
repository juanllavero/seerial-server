import type { Server } from "../../domain/Server";

export interface ServersRepositoryPort {
	getServerConfig(): Promise<Server | null>;
	create(server: Server): Promise<Server | null>;
	update(id: string, serverConfig: Partial<Server>): Promise<Server>;
}
