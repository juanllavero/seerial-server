import { messages } from "@/config/messages";
import { Get, Path, Query, Route, Security, Tags } from "tsoa";
import { MediaDetailsService } from "../../services/MediaDetailsService";
import { BadRequestException } from "../exceptions/HTTPExceptions";
import { ApiResponse } from "../http/APIResponse";

@Route("media")
@Tags("Media")
export class MediaController {
  /**
   * Get media details by type and ID
   */
  @Get("details/{type}")
  @Security("cookieAuth")
  public async getDetails(
    @Path() type: string,
    @Query() id: string
  ): Promise<ApiResponse<any>> {
    return ApiResponse.success(
      await MediaDetailsService.getDetails(type, id),
      messages.success.fetch
    );
  }

  /**
   * Get media background by item type, media type and ID
   */
  @Get("{itemType}/{mediaType}")
  @Security("cookieAuth")
  public async getMediaBackground(
    @Path() itemType: string,
    @Path() mediaType: string,
    @Query() id: string
  ): Promise<ApiResponse<any>> {
    if (!["movie", "series", "season"].includes(itemType)) {
      throw new BadRequestException(
        "Invalid itemType. Must be 'movie', 'series', or 'season'."
      );
    }

    if (!["video", "music"].includes(mediaType)) {
      throw new Error("Invalid mediaType. Must be 'video' or 'music'.");
    }

    return ApiResponse.success(
      await MediaDetailsService.findMediaBackground(
        mediaType as "video" | "music",
        itemType as "movie" | "series" | "season",
        id
      ),
      messages.success.fetch
    );
  }
}
