import { Get, Query, Route, Security, Tags } from "tsoa";
import { externalSearchService } from "../../adapters/di/container";

@Route("search")
@Tags("Search")
export class SearchController {
  /**
   * Search downloadable media in YouTube
   */
  @Get("media")
  @Security("cookieAuth")
  public async searchDownloadableMedia(@Query() query: string): Promise<any> {
    return await externalSearchService.searchDownloadableMedia(query);
  }
}
