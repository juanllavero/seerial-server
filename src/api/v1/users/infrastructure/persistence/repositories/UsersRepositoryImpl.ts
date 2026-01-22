import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { ServerConfigManager } from "@/managers/ServerConfigManager";
import { UserType } from "@/utils/constants";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UsersRepositoryPort } from "../../../application/ports/UsersRepositoryPort";
import { User } from "../../../domain/User";
import { UserModel } from "../models/UserModel";

export class UsersRepositoryImpl
  extends BaseRepository
  implements UsersRepositoryPort
{
  async findAll(): Promise<User[]> {
    return this.handleRepositoryError(async () => {
      const users = await UserModel.findAll({
        where: { hideInLogin: false },
        attributes: ["id", "username", "type", "avatar"], // Exclude sensitive fields like password
      });
      return users.map((user) => user.toJSON());
    }, `Failed to retrieve users`);
  }

  async authenticate(
    username: string,
    password: string | null
  ): Promise<{ token: string; user: User | null } | null> {
    const user = await UserModel.findOne({ where: { username } });
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

    const safeUser = await UserModel.findByPk(user.id, {
      attributes: { exclude: ["password"] },
    });
    return {
      token,
      user: safeUser ? safeUser.toJSON() : user.toJSON(),
    };
  }

  async create(
    data: Partial<{
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
    }>
  ): Promise<User> {
    if (data.type === "admin" && (!data.password || !data.password.trim())) {
      throw new ApiError(400, messages.errors.validation.userAdminNoPassword);
    }

    return this.handleRepositoryError(async () => {
      const hashedPassword = data.password
        ? await bcrypt.hash(data.password, 10)
        : null;
      const user = await UserModel.create({
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

      const safeUser = await UserModel.findByPk(user.id, {
        attributes: { exclude: ["password"] },
      });
      return safeUser ? safeUser.toJSON() : user.toJSON();
    }, `Failed to create user`);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return this.handleRepositoryError(async () => {
      const user = await UserModel.findByPk(id);

      if (!user) {
        throw new ApiError(404, messages.errors.notFound.user);
      }

      if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
      }

      await user.update(data);

      const safeUser = await UserModel.findByPk(user.id, {
        attributes: { exclude: ["password"] },
      });
      return safeUser ? safeUser.toJSON() : user.toJSON();
    }, `Failed to update user with id ${id}`);
  }

  async delete(id: string): Promise<void> {
    return this.handleRepositoryError(async () => {
      const user = await UserModel.findByPk(id);
      if (!user) {
        throw new ApiError(404, messages.errors.notFound.user);
      }
      await user.destroy();
    }, `Failed to delete user with id ${id}`);
  }
}
