import type { BasicUser, User } from "../interfaces/domain-user";

export const toBasicUser = (user: User): BasicUser => ({
    id: user.id,
    username: user.username,
    avatar: user.avatar || null,
    type: user.type
});
