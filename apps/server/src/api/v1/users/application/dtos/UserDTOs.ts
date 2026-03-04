import { UserType } from "@/utils/constants";

export interface LoginDTO {
  username: string;
  password: string;
}

export interface LoginResponseDTO {
  user: UserDTO | null;
  token?: string;
  error?: string;
}

export interface CreateUserDTO {
  username: string;
  password?: string;
  avatar?: string;
  allowRemote?: boolean;
  type?: UserType;
  allowVideoTranscoding?: boolean;
  internetBitrateLimit?: number;
  allowDownloads?: boolean;
  hideInLogin?: boolean;
  maxSessions?: number;
}

export interface UpdateUserDTO {
  username?: string;
  password?: string;
  avatar?: string;
  allowRemote?: boolean;
  type?: UserType;
  allowVideoTranscoding?: boolean;
  internetBitrateLimit?: number;
  allowDownloads?: boolean;
  hideInLogin?: boolean;
  maxSessions?: number;
}

export interface UserDTO {
  id: string;
  username: string;
  avatar?: string;
  allowRemote: boolean;
  type: string;
  allowVideoTranscoding: boolean;
  internetBitrateLimit?: number;
  allowDownloads: boolean;
  hideInLogin: boolean;
  maxSessions: number;
}
