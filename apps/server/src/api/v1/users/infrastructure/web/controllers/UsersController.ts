import { useCases } from "@/api/v1/shared/infrastructure/adapters/di/container";
import { BadRequestException } from "@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions";
import { ApiResponse } from "@/api/v1/shared/infrastructure/web/http/APIResponse";
import { messages } from "@/config/messages";
import jwt from "jsonwebtoken";
import {
  Body,
  Controller,
  Delete,
  Path,
  Post,
  Put,
  Route,
  Security,
  Tags,
} from "tsoa";
import {
  CreateUserDTO,
  LoginDTO,
  LoginResponseDTO,
  UpdateUserDTO,
  UserDTO,
} from "../../../application/dtos/UserDTOs";
import { toUserDTO } from "../../../domain/User";

@Route("users")
@Tags("Users")
export class UsersController extends Controller {
  /**
   * Create a new user
   */
  @Post()
  @Security("managementAuth")
  public async create(
    @Body() body: CreateUserDTO
  ): Promise<ApiResponse<{ token: string; user: UserDTO }>> {
    const user = await useCases.createUser().execute(body);
    // Generate token for auto-login after user creation
    const token = jwt.sign(
      { userId: user.id, username: user.username, type: user.type },
      process.env.JWT_SECRET || "",
      { expiresIn: "30d" }
    );
    return ApiResponse.success(
      { token, user: toUserDTO(user) },
      messages.success.create
    );
  }

  /**
   * Update user details
   */
  @Put("{id}")
  @Security("managementAuth")
  public async update(
    @Path() id: string,
    @Body() body: UpdateUserDTO
  ): Promise<ApiResponse<UserDTO>> {
    const result = await useCases.updateUser().execute(id, body);
    return ApiResponse.success(toUserDTO(result), messages.success.update);
  }

  /**
   * Delete a user
   */
  @Delete("{id}")
  @Security("managementAuth")
  public async delete(@Path() id: string): Promise<ApiResponse<null>> {
    await useCases.deleteUser().execute(id);
    return ApiResponse.success(null, messages.success.delete);
  }

  /**
   * Get all users (public access)
   */
  @Put("public")
  @Security("public")
  public async findAll(): Promise<ApiResponse<UserDTO[]>> {
    const result = await useCases.getAllUsers().execute();
    return ApiResponse.success(
      result.map((u) => toUserDTO(u)),
      messages.success.fetch
    );
  }

  /**
   * User login
   */
  @Post("login")
  @Security("public")
  public async login(
    @Body() body: LoginDTO
  ): Promise<ApiResponse<LoginResponseDTO>> {
    const { username, password } = body;

    const result = await useCases
      .authenticateUser()
      .execute(username, password);

    if (!result || !result.user) {
      this.setStatus(401);
      throw new BadRequestException(
        messages.errors.server.userNotAuthenticated
      );
    }

    const cookie = [
      `token=${result.token}`,
      "HttpOnly",
      "Path=/",
      "SameSite=Lax",
      process.env.NODE_ENV === "production" ? "Secure" : null,
    ]
      .filter(Boolean)
      .join("; ");

    this.setHeader("Set-Cookie", cookie);

    return ApiResponse.success(
      {
        user: toUserDTO(result.user),
        token: result.token,
      },
      messages.success.login
    );
  }
}
