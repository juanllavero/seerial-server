import { MediaDetailsManager } from "@/managers/MediaDetailsManager";
import { Get, Path, Query, Route, Security, Tags } from "tsoa";

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
  ): Promise<any> {
    if (typeof id !== "string") {
      throw new Error("Query parameter 'id' is required.");
    }
    return await MediaDetailsManager.getDetails(type, id);
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
  ): Promise<any> {
    if (!["movie", "series", "season"].includes(itemType)) {
      throw new Error(
        "Invalid itemType. Must be 'movie', 'series', or 'season'."
      );
    }
    if (!["video", "music"].includes(mediaType)) {
      throw new Error("Invalid mediaType. Must be 'video' or 'music'.");
    }
    if (typeof id !== "string") {
      throw new Error("Query parameter 'id' is required.");
    }

    return await MediaDetailsManager.findMediaBackground(
      mediaType as "video" | "music",
      itemType as "movie" | "series" | "season",
      id
    );
  }
}
