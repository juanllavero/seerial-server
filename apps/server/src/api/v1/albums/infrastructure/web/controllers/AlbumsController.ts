import { Body, Controller, Delete, Get, Path, Put, Route, Security, Tags } from 'tsoa';
import { useCases } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { ApiResponse } from '@/api/v1/shared/infrastructure/web/http/APIResponse';
import { messages } from '@/config/messages';
import type { UpdateAlbumDTO } from '../../../application/dtos/AlbumDTOs';
import type { Album } from '../../../domain/Album';

@Route('albums')
@Tags('Albums')
export class AlbumsController extends Controller {
  /**
   * Get album by ID
   */
  @Get('{id}')
  @Security('cookieAuth')
  public async get(@Path() id: string): Promise<ApiResponse<Album | null>> {
    const result = await useCases.getAlbumById().execute(id);

    return ApiResponse.success(result, messages.success.fetch);
  }

  /**
   * Update album details
   */
  @Put('{id}')
  @Security('adminAuth')
  public async update(
    @Path() id: string,
    @Body() body: UpdateAlbumDTO,
  ): Promise<ApiResponse<Album>> {
    const result = await useCases.updateAlbum().execute(id, body);

    return ApiResponse.success(result, messages.success.update);
  }

  /**
   * Delete an album
   */
  @Delete('{id}')
  @Security('adminAuth')
  public async delete(@Path() id: string): Promise<ApiResponse<null>> {
    await useCases.deleteAlbum().execute(id);

    return ApiResponse.success(null, messages.success.delete);
  }
}
