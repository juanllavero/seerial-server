import { ApiResponse } from "@/api/v0/shared/application/dtos/DTOs";

export interface LoginDTO {
  username: string;
  password: string;
}

export interface CreateUserDTO {
  username: string;
  password?: string;
  avatar?: string;
  allowRemote?: boolean;
  type?: string;
  allowVideoTranscoding?: boolean;
  internetBitrateLimit?: number;
  allowDownloads?: boolean;
  hideInLogin?: boolean;
  maxSessions?: number;
  serverId?: string;
}

export interface UpdateUserDTO {
  username?: string;
  password?: string;
  avatar?: string;
  allowRemote?: boolean;
  type?: string;
  allowVideoTranscoding?: boolean;
  internetBitrateLimit?: number;
  allowDownloads?: boolean;
  hideInLogin?: boolean;
  maxSessions?: number;
  serverId?: string;
}

export interface UserResponse extends ApiResponse {}
