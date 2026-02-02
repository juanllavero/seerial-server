import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import { LibraryModel } from "@/api/v1/libraries/infrastructure/persistence/models/LibraryModel";
import { ServerConfigService } from "@/api/v1/servers/infrastructure/services/ServerConfigService";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { GenericRepositoryHelper } from "@/helpers/GenericRepositoryHelper";
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
  // Generic helper for common CRUD operations
  private helper: GenericRepositoryHelper<UserModel, User>;

  constructor() {
    super();

    // Initialize helper
    this.helper = new GenericRepositoryHelper(UserModel, {
      entityName: "User",
      generateShortId: true,
    });
  }

  async findAll(): Promise<User[]> {
    return this.helper.findAll({
      where: { hideInLogin: false },
      select: ["id", "username", "type", "avatar"], // Exclude sensitive fields like password
    });
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

    const safeUser = await UserModel.findOne({
      where: { id: user.id },
      select: { password: false },
    });
    return {
      token,
      user: safeUser
        ? (safeUser as unknown as User)
        : (user as unknown as User),
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

    const hashedPassword = data.password
      ? await bcrypt.hash(data.password, 10)
      : null;

    const userData = {
      ...data,
      password: hashedPassword || undefined,
      type: data.type || UserType.NORMAL,
      allowRemote: data.allowRemote ?? true,
      allowVideoTranscoding: data.allowVideoTranscoding ?? true,
      allowDownloads: data.allowDownloads ?? true,
      hideInLogin: data.hideInLogin ?? false,
      maxSessions: data.maxSessions ?? 0,
      serverId: ServerConfigService.serverConfig.id,
    };

    const user = await this.helper.create(userData, true);

    if (data.libraryIds) {
      // Load the libraries and assign them to the user
      const libraries = await LibraryModel.findByIds(data.libraryIds);
      const userModel = user as unknown as UserModel;
      userModel.libraries = libraries;
      await userModel.save();
    }

    const safeUser = await UserModel.findOne({
      where: { id: user.id },
      select: { password: false },
    });
    return safeUser ? (safeUser as unknown as User) : (user as unknown as User);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    return this.helper.update(id, data);
  }

  async delete(id: string): Promise<void> {
    const validatedId = this.validateId(id, "User ID");
    this.helper.delete(validatedId);
  }
}
