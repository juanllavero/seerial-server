import { MessageResponse } from "@/api/v1/shared/application/dtos/DTOs";
import { useCases } from "@/api/v1/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import {
  Body,
  Controller,
  Delete,
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
