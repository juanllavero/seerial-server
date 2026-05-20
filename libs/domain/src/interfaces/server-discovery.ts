import type { BasicUser } from "./domain-user";

export type ServerStatus = "checking" | "online" | "offline";

export interface DiscoveredServer {
    key: string;
    name: string;
    url: string;
    status: ServerStatus;
    users: BasicUser[];
}

export interface PersistedServer {
    name: string;
    url: string;
}

export interface BasicServer {
    id: string;
    name: string;
    status: string;
    url: string;
    users: BasicUser[];
}
