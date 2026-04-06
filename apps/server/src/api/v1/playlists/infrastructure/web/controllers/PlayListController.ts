import { Body, Controller, Delete, Get, Patch, Path, Post, Route, Security, Tags } from 'tsoa';
import { useCases } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { NotFoundException } from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { ApiResponse } from '@/api/v1/shared/infrastructure/web/http/APIResponse';
import { messages } from '@/config/messages';
import type {
  AddSongToPlaylistDTO,
  CreatePlayListDTO,
  UpdatePlayListDTO,
} from '../../../application/dtos/PlayListDTOs';
import type { PlayList } from '../../../domain/PlayList';

@Route('playlists')
@Tags('Playlists')
export class PlayListController extends Controller {
  /**
   * Get all playlists
   */
  @Get()
  @Security('adminAuth')
  public async getAll(): Promise<ApiResponse<PlayList[]>> {
    const result = await useCases.getPlayLists().execute();
    return ApiResponse.success(result, messages.success.fetch);
  }

  /**
   * Get playlist by ID
   */
  @Get('{id}')
  @Security('adminAuth')
  public async getById(@Path() id: string): Promise<ApiResponse<PlayList>> {
    const result = await useCases.getPlayListById().execute(id);

    if (!result) {
      throw new NotFoundException(messages.errors.notFound.playlist);
    }

    return ApiResponse.success(result, messages.success.fetch);
  }

  /**
   * Create a new playlist
   */
  @Post()
  @Security('adminAuth')
  public async create(@Body() body: CreatePlayListDTO): Promise<ApiResponse<PlayList>> {
    const result = await useCases.createPlayList().execute(body);
    return ApiResponse.success(result, messages.success.create);
  }

  /**
   * Update playlist
   */
  @Patch('{id}')
  @Security('adminAuth')
  public async update(
    @Path() id: string,
    @Body() body: UpdatePlayListDTO,
  ): Promise<ApiResponse<PlayList>> {
    const result = await useCases.updatePlayList().execute(id, body);
    return ApiResponse.success(result, messages.success.update);
  }

  /**
   * Delete playlist
   */
  @Delete('{id}')
  @Security('adminAuth')
  public async delete(@Path() id: string): Promise<ApiResponse<null>> {
    await useCases.deletePlayList().execute(id);
    return ApiResponse.success(null, messages.success.delete);
  }

  /**
   * Add song to playlist
   */
  @Post('{id}/songs')
  @Security('adminAuth')
  public async addSong(
    @Path() id: string,
    @Body() body: AddSongToPlaylistDTO,
  ): Promise<ApiResponse<null>> {
    const { songId } = body;

    await useCases.addSongToPlayList().execute(id, songId);
    return ApiResponse.success(null, messages.success.create);
  }

  /**
   * Remove song from playlist
   */
  @Delete('{id}/songs/{songId}')
  @Security('adminAuth')
  public async removeSong(@Path() id: string, @Path() songId: string): Promise<ApiResponse<null>> {
    await useCases.removeSongFromPlayList().execute(id, songId);
    return ApiResponse.success(null, messages.success.delete);
  }
}
