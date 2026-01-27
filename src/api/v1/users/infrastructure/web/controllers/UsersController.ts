import { useCases } from "@/api/v1/shared/infrastructure/adapters/di/container";
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
  UserResponse,
} from "../../../application/dtos/UserDTOs";
import { User } from "../../../domain/User";

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
  ): Promise<{ token: string; user: User }> {
    const user = await useCases.createUser().execute(body);
    // Generate token for auto-login after user creation
    const token = jwt.sign(
      { userId: user.id, username: user.username, type: user.type },
      process.env.JWT_SECRET || "",
      { expiresIn: "30d" }
    );
    return { token, user };
  }

  /**
   * Update user details
   */
  @Put("{id}")
  @Security("managementAuth")
  public async update(
    @Path() id: string,
    @Body() body: UpdateUserDTO
  ): Promise<UserResponse> {
    const result = await useCases.updateUser().execute(id, body);

    return {
      status: "success",
      message: messages.success.update,
      data: result,
    };
  }

  /**
   * Delete a user
   */
  @Delete("{id}")
  @Security("managementAuth")
  public async delete(@Path() id: string): Promise<UserResponse> {
    const result = await useCases.deleteUser().execute(id);

    return {
      status: "success",
      message: messages.success.delete,
      data: result,
    };
  }

  /**
   * Get all users (public access)
   */
  @Put("public")
  @Security("public")
  public async findAll(): Promise<UserResponse> {
    const result = await useCases.getAllUsers().execute();

    return {
      status: "success",
      message: messages.success.fetch,
      data: result,
    };
  }

  /**
   * User login
   */
  @Post("login")
  @Security("public")
  public async login(@Body() body: LoginDTO): Promise<LoginResponseDTO> {
    const { username, password } = body;

    const result = await useCases
      .authenticateUser()
      .execute(username, password);

    if (!result) {
      this.setStatus(401);
      return { user: null, error: "Invalid credentials" };
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

    return {
      token: result.token,
      user: result.user,
    };
  }
}
