import { MessageResponse } from "@/api/v0/shared/application/dtos/DTOs";
import { useCases } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { Controller, Delete, Path, Put, Route, Security, Tags } from "tsoa";
import {
  AlbumResponse,
  UpdateAlbumDTO,
} from "../../../application/dtos/AlbumDTOs";

@Route("albums")
@Tags("Albums")
export class AlbumsController extends Controller {
  /**
   * Update album details
   */
  @Put("{id}")
  @Security("cookieAuth")
  public async update(
    @Path() id: string,
    body: UpdateAlbumDTO
  ): Promise<AlbumResponse> {
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

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
  @Security("cookieAuth")
  public async delete(@Path() id: string): Promise<MessageResponse> {
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

    await useCases.deleteAlbum().execute(id);

    return { message: messages.success.delete };
  }
}
