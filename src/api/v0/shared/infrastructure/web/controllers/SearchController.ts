import { ExternalSearchManager } from "@/managers/ExternalSearchManager";
import { Get, Query, Route, Security, Tags } from "tsoa";

@Route("search")
@Tags("Search")
export class SearchController {
  /**
   * Search downloadable media in YouTube
   */
  @Get("media")
  @Security("cookieAuth")
  public async searchDownloadableMedia(@Query() query: string): Promise<any> {
    if (typeof query !== "string") {
      throw new Error("Query parameter 'query' is required.");
    }
    return await ExternalSearchManager.searchDownloadableMedia(query);
  }
}
