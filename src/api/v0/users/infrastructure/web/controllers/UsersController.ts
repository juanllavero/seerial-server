import { useCases } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
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
  @Security("cookieAuth")
  public async create(@Body() body: CreateUserDTO): Promise<any> {
    return await useCases.createUser().execute(body);
  }

  /**
   * Update user details
   */
  @Put("{id}")
  @Security("cookieAuth")
  public async update(
    @Path() id: string,
    @Body() body: UpdateUserDTO
  ): Promise<UserResponse> {
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

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
  @Security("cookieAuth")
  public async delete(@Path() id: string): Promise<UserResponse> {
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

    const result = await useCases.deleteUser().execute(id);

    return {
      status: "success",
      message: messages.success.delete,
      data: result,
    };
  }
}
