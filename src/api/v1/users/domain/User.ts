import { Library } from "../../libraries/domain/Library";
import { Server } from "../../servers/domain/Server";

export interface User {
  id: string;
  username: string;
  password?: string;
  avatar?: string;
  allowRemote: boolean;
  type: string;
  allowVideoTranscoding: boolean;
  internetBitrateLimit?: number;
  allowDownloads: boolean;
  hideInLogin: boolean;
  maxSessions: number;

  // Associations
  serverId: string;
  server: Server;
  libraries: Library[];
}
