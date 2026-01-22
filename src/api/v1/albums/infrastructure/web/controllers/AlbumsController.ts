import { MessageResponse } from "@/api/v1/shared/application/dtos/DTOs";
import { useCases } from "@/api/v1/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Put,
  Route,
  Security,
  Tags,
} from "tsoa";
import {
  AlbumResponse,
  UpdateAlbumDTO,
} from "../../../application/dtos/AlbumDTOs";

@Route("albums")
@Tags("Albums")
export class AlbumsController extends Controller {
  /**
   * Get album by ID
   */
  @Get("{id}")
  @Security("cookieAuth")
  public async get(@Path() id: string): Promise<AlbumResponse> {
    const result = await useCases.getAlbumById().execute(id);

    return {
      status: "success",
      message: messages.success.fetch,
      data: result,
    };
  }

  /**
   * Update album details
   */
  @Put("{id}")
  @Security("adminAuth")
  public async update(
    @Path() id: string,
    @Body() body: UpdateAlbumDTO
  ): Promise<AlbumResponse> {
    const result = await useCases.updateAlbum().execute(id, body);

    return {
      status: "success",
      message: messages.success.update,
      data: result,
    };
  }

  /**
   * Delete an album
   */
  @Delete("{id}")
  @Security("adminAuth")
  public async delete(@Path() id: string): Promise<MessageResponse> {
    await useCases.deleteAlbum().execute(id);

    return { message: messages.success.delete };
  }
}
