import type { Library } from "./domain-media";

export type UserType = "normal" | "admin";

export interface User {
    id: string;
    username: string;
    password?: string;
    avatar?: string;
    allowRemote: boolean;
    type: UserType;
    allowVideoTranscoding: boolean;
    internetBitrateLimit?: number;
    allowDownloads: boolean;
    hideInLogin: boolean;
    maxSessions: number;
    libraries: Library[];
}

export interface BasicUser {
    id: string;
    username: string;
    avatar: string | null;
    type: UserType;
}

export interface SearchableUser {
    id: string;
    email: string;
    image?: string;
    name?: string;
}
