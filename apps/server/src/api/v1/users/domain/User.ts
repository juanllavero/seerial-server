import type { Library } from '../../libraries/domain/Library';
import type { UserDTO } from '../application/dtos/UserDTOs';

export type UserType = 'normal' | 'admin';

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

export const toUserDTO = (user: User): UserDTO => ({
  id: user.id,
  username: user.username,
  avatar: user.avatar,
  allowRemote: user.allowRemote,
  type: user.type,
  allowVideoTranscoding: user.allowVideoTranscoding,
  internetBitrateLimit: user.internetBitrateLimit,
  allowDownloads: user.allowDownloads,
  hideInLogin: user.hideInLogin,
  maxSessions: user.maxSessions,
});
