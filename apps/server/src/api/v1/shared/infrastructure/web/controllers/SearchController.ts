import { messages } from "@/config/messages";
import { MediaSearchResult } from "@/data/interfaces/SearchResults";
import { Get, Query, Route, Security, Tags } from "tsoa";
import { externalSearchService } from "../../adapters/di/container";
import { ApiResponse } from "../http/APIResponse";

@Route("search")
@Tags("Search")
export class SearchController {
  /**
   * Search downloadable media in YouTube
   */
  @Get("media")
  @Security("cookieAuth")
  public async searchDownloadableMedia(
    @Query() query: string
  ): Promise<ApiResponse<MediaSearchResult[]>> {
    return ApiResponse.success(
      await externalSearchService.searchDownloadableMedia(query),
      messages.success.fetch
    );
  }
}
