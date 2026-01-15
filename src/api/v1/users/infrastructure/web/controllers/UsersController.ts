import { useCases } from "@/api/v1/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
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
  UpdateUserDTO,
  UserResponse,
} from "../../../application/dtos/UserDTOs";

@Route("users")
@Tags("Users")
export class UsersController extends Controller {
  /**
   * Create a new user
   */
  @Post()
  @Security("managementAuth")
  public async create(@Body() body: CreateUserDTO): Promise<any> {
    return await useCases.createUser().execute(body);
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
  @Delete("login")
  @Security("public")
  public async login(@Body() body: any): Promise<any> {
    const { username, password } = body;
    return await useCases.authenticateUser().execute(username, password);
  }
}
