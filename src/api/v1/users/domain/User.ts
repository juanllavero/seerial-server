import { Library } from "../../libraries/domain/Library";

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

  // Associations
  libraries: Library[];
}
