import { useCases } from "@/api/v1/shared/infrastructure/adapters/di/container";
import { NotFoundException } from "@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions";
import { ApiResponse } from "@/api/v1/shared/infrastructure/web/http/APIResponse";
import { messages } from "@/config/messages";
import { Body, Controller, Get, Path, Put, Route, Security, Tags } from "tsoa";
import { UpdateArtistDTO } from "../../../application/dtos/ArtistDTOs";
import { Artist } from "../../../domain/Artist";

@Route("artists")
@Tags("Artists")
export class ArtistsController extends Controller {
  /**
   * Get artist by ID
   */
  @Get("{id}")
  @Security("adminAuth")
  public async getById(@Path() id: string): Promise<ApiResponse<Artist>> {
    const result = await useCases.getArtistById().execute(id);

    if (!result) {
      throw new NotFoundException("Artist not found");
    }

    return ApiResponse.success(result, messages.success.fetch);
  }

  /**
   * Update artist details
   */
  @Put("{id}")
  @Security("adminAuth")
  public async update(
    @Path() id: string,
    @Body() body: UpdateArtistDTO
  ): Promise<ApiResponse<Artist>> {
    const result = await useCases.updateArtist().execute(id, body);

    return ApiResponse.success(result, messages.success.update);
  }
}
