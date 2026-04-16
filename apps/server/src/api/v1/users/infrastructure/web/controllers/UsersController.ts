import type { User } from "@seerial/domain";
import jwt from "jsonwebtoken";
import {
	Body,
	Controller,
	Delete,
	Get,
	Patch,
	Path,
	Post,
	Route,
	Security,
	Tags,
} from "tsoa";
import { useCases } from "@/api/v1/shared/infrastructure/adapters/di/container";
import { BadRequestException } from "@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions";
import { ApiResponse } from "@/api/v1/shared/infrastructure/web/http/APIResponse";
import { messages } from "@/config/messages";
import { getJwtSecret } from "@/utils/jwt-secret";
import type {
	CreateUserDTO,
	LoginDTO,
	LoginResponseDTO,
	UpdateUserDTO,
	UserDTO,
} from "../../../application/dtos/UserDTOs";

const mapUserToDTO = (user: User): UserDTO => ({
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

@Route("users")
@Tags("Users")
export class UsersController extends Controller {
	/**
	 * Create a new user
	 */
	@Post()
  @Security('managementAuth')
  public async create(
    @Body() body: CreateUserDTO,
  ): Promise<ApiResponse<{ token: string; user: UserDTO }>> {
    const user = await useCases.createUser().execute(body);
    // Generate token for auto-login after user creation
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        type: user.type,
        tokenVersion: (user as unknown as { tokenVersion: number }).tokenVersion ?? 0,
      },
      getJwtSecret(),
      { expiresIn: '30d' },
    );
    return ApiResponse.success({ token, user: mapUserToDTO(user) }, messages.success.create);
  }

	/**
	 * Update user details
	 */
	@Patch("{id}")
	@Security("managementAuth")
	public async update(
		@Path() id: string,
		@Body() body: UpdateUserDTO,
	): Promise<ApiResponse<UserDTO>> {
		const result = await useCases.updateUser().execute(id, body);
		return ApiResponse.success(mapUserToDTO(result), messages.success.update);
	}

	/**
	 * Delete a user
	 */
	@Delete('{id}')
  @Security('managementAuth')
  public async delete(@Path() id: string): Promise<ApiResponse<null>> {
    await useCases.deleteUser().execute(id);
    return ApiResponse.success(null, messages.success.delete);
  }

	/**
	 * Get all users (public access)
	 */
	@Get("public")
	@Security("public")
	public async findAll(): Promise<ApiResponse<UserDTO[]>> {
		const result = await useCases.getAllUsers().execute();
		return ApiResponse.success(
			result.map((u) => mapUserToDTO(u)),
			messages.success.fetch,
		);
	}

	/**
	 * User login
	 */
	@Post('login')
  @Security('public')
  public async login(@Body() body: LoginDTO): Promise<ApiResponse<LoginResponseDTO>> {
    const { username, password } = body;

    const result = await useCases.authenticateUser().execute(username, password);

    if (!result?.user) {
      this.setStatus(401);
      throw new BadRequestException(messages.errors.server.userNotAuthenticated);
    }

    const cookie = [
      `token=${result.token}`,
      'HttpOnly',
      'Path=/',
      'SameSite=Lax',
      process.env.NODE_ENV === 'production' ? 'Secure' : null,
    ]
      .filter(Boolean)
      .join('; ');

    this.setHeader('Set-Cookie', cookie);

    return ApiResponse.success(
      {
        user: mapUserToDTO(result.user),
        token: result.token,
      },
      messages.success.login,
    );
  }

	/**
	 * User logout
	 */
	@Post("logout")
	@Security("public")
	public async logout(): Promise<ApiResponse<null>> {
		const cookie = [
			"token=",
			"HttpOnly",
			"Path=/",
			"SameSite=Lax",
			"Max-Age=0",
			"Expires=Thu, 01 Jan 1970 00:00:00 GMT",
			process.env.NODE_ENV === "production" ? "Secure" : null,
		]
			.filter(Boolean)
			.join("; ");

		this.setHeader("Set-Cookie", cookie);

		return ApiResponse.success(null, "Logged out successfully");
	}
}
