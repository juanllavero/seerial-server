import type { LibrarySearchItem, MediaSearchResult } from '@seerial/domain';
import { Get, Query, Route, Security, Tags } from 'tsoa';
import { messages } from '@/config/messages';
import { externalSearchService, localLibrarySearchService } from '../../adapters/di/container';
import { ApiResponse } from '../http/APIResponse';

@Route('search')
@Tags('Search')
export class SearchController {
  /**
   * Search downloadable media in YouTube
   */
  @Get('media')
  @Security('cookieAuth')
  public async searchDownloadableMedia(
    @Query() query: string,
  ): Promise<ApiResponse<MediaSearchResult[]>> {
    return ApiResponse.success(
      await externalSearchService.searchDownloadableMedia(query),
      messages.success.fetch,
    );
  }

  /**
   * Search local library content (collections, movies, series, albums, artists, episodes and songs).
   */
  @Get('library')
  @Security('cookieAuth')
  public async searchLibraryContent(
    @Query() query: string,
    @Query() limit?: number,
  ): Promise<ApiResponse<LibrarySearchItem[]>> {
    return ApiResponse.success(
      await localLibrarySearchService.search(query, limit),
      messages.success.fetch,
    );
  }
}
