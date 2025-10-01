import { messages } from "@/config/messages";
import { User } from "@/data/models/Main/User.model";
import ApiError from "@/utils/ApiError";
import { UserType } from "@/utils/constants";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UniqueConstraintError } from "sequelize";
import { ServerConfigManager } from "./ServerConfigManager";

export class UserManager {
  static async authenticateUser(
    username: string,
    password: string | null
  ): Promise<string | null> {
    const user = await User.findOne({ where: { username } });
    if (!user) return null;

    if (user.password) {
      if (!password || !(await bcrypt.compare(password, user.password))) {
        return null;
      }
    } else if (password) {
      return null; // No password set, but one provided
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username, type: user.type },
      process.env.JWT_SECRET || "",
      { expiresIn: "30d" }
    );
    return token;
  }

  static async createUser(data: {
    username: string;
    password?: string;
    type?: UserType;
    allowRemote?: boolean;
    allowVideoTranscoding?: boolean;
    internetBitrateLimit?: number;
    allowDownloads?: boolean;
    hideInLogin?: boolean;
    maxSessions?: number;
    libraryIds?: string[];
  }) {
    try {
      const hashedPassword = data.password
        ? await bcrypt.hash(data.password, 10)
        : null;
      const user = await User.create({
        ...data,
        password: hashedPassword,
        type: data.type || UserType.NORMAL,
        allowRemote: data.allowRemote ?? true,
        allowVideoTranscoding: data.allowVideoTranscoding ?? true,
        allowDownloads: data.allowDownloads ?? true,
        hideInLogin: data.hideInLogin ?? false,
        maxSessions: data.maxSessions ?? 0,
        serverId: ServerConfigManager.serverConfig.id,
      });

      if (data.libraryIds) {
        await user.$set("libraries", data.libraryIds);
      }
      return user;
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new ApiError(409, messages.errors.validation.userDuplicated);
      }

      throw new ApiError(500, messages.errors.server.internal);
    }
  }

  static async updateUser(userId: string, data: Partial<User>) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new ApiError(404, messages.errors.notFound.user);
      }

      if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
      }

      await user.update(data);
      return user;
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new ApiError(409, messages.errors.validation.userDuplicated);
      }

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, messages.errors.server.internal);
    }
  }

  static async deleteUser(userId: string) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new ApiError(404, messages.errors.notFound.user);
      }

      await user.destroy();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, messages.errors.server.internal);
    }
  }
}
