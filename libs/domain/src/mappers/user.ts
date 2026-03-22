import type { BasicUser, User, UserDTO } from "../interfaces/domain-user";

export const toBasicUser = (user: User): BasicUser => ({
    id: user.id,
    username: user.username,
    avatar: user.avatar || null,
    type: user.type
});

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
    maxSessions: user.maxSessions
});
