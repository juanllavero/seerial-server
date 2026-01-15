import { MessageResponse } from "@/api/v0/shared/application/dtos/DTOs";
import { useCases } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Put,
  Route,
  Security,
  Tags,
} from "tsoa";
import {
  ArtistResponse,
  CreateArtistDTO,
  UpdateArtistDTO,
} from "../../../application/dtos/ArtistDTOs";

@Route("artists")
@Tags("Artists")
export class ArtistsController extends Controller {
  /**
   * Create a new artist
   */
  @Post()
  @Security("adminAuth")
  public async create(@Body() body: CreateArtistDTO): Promise<ArtistResponse> {
    const { name } = body;

    if (!name) {
      throw new ApiError(400, messages.errors.validation.notEnoughParams);
    }

    const result = await useCases.addArtist().execute({ name });

    if (!result) {
      throw new ApiError(409, "Artist already exists");
    }

    return {
      status: "success",
      message: messages.success.create,
      data: result,
    };
  }

  /**
   * Get artist by ID
   */
  @Get("{id}")
  @Security("adminAuth")
  public async getById(@Path() id: string): Promise<ArtistResponse> {
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

    const result = await useCases.getArtistById().execute(id);

    if (!result) {
      throw new ApiError(404, "Artist not found");
    }

    return {
      status: "success",
      message: "Artist retrieved successfully",
      data: result,
    };
  }

  /**
   * Update artist details
   */
  @Put("{id}")
  @Security("adminAuth")
  public async update(
    @Path() id: string,
    @Body() body: UpdateArtistDTO
  ): Promise<ArtistResponse> {
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

    const result = await useCases.updateArtist().execute(id, body);

    return {
      status: "success",
      message: messages.success.update,
      data: result,
    };
  }

  /**
   * Delete an artist
   */
  @Delete("{id}")
  @Security("adminAuth")
  public async delete(@Path() id: string): Promise<MessageResponse> {
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

    await useCases.deleteArtist().execute(id);

    return { message: messages.success.delete };
  }
}
