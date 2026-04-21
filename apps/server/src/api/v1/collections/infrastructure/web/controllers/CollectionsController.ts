import type { Collection } from '@seerial/domain';
import type { Request as ExpressRequest } from 'express';
import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from 'tsoa';
import { useCases } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { ApiResponse } from '@/api/v1/shared/infrastructure/web/http/APIResponse';
import { messages } from '@/config/messages';
import { getUserId } from '@/utils/auth';
import type {
  CollectionContentDTO,
  CollectionSummaryDTO,
  CreateCollectionWithItemDTO,
  MusicExtrasDTO,
  ReorderContentDTO,
  UpdateCollectionDTO,
} from '../../../application/dtos/CollectionDTOs';

@Route('collections')
@Tags('Collections')
export class CollectionsController extends Controller {
  /**
   * Get all collections (id and title only)
   */
  @Get()
  @Security('adminAuth')
  public async getAll(): Promise<ApiResponse<CollectionSummaryDTO[]>> {
    const collections = await useCases.getAllCollections().execute();

    return ApiResponse.success(collections, messages.success.fetch);
  }

  /**
   * Create a collection with an initial item (movie, series or album)
   */
  @Post()
  @Security('adminAuth')
  public async create(
    @Body() body: CreateCollectionWithItemDTO,
  ): Promise<ApiResponse<Collection>> {
    const collection = await useCases.createCollectionWithItem().execute(body);

    return ApiResponse.success(collection, messages.success.create);
  }

  /**
   * Get music extras for a collection
   */
  @Get('{collectionId}/music-extras')
  @Security('adminAuth')
  public async getMusicExtras(
    @Path() collectionId: string,
  ): Promise<ApiResponse<MusicExtrasDTO[]>> {
    const musicExtras = await useCases.getMusicExtras().execute(collectionId);

    return ApiResponse.success(musicExtras, messages.success.fetch);
  }

  /**
   * Get collection content items (movies, series, albums)
   */
  @Get('{collectionId}/content')
  @Security('adminAuth')
  public async getCollectionContent(
    @Path() collectionId: string,
    @Request() req: ExpressRequest,
  ): Promise<ApiResponse<CollectionContentDTO>> {
    const userId = getUserId(req);
    const content = await useCases.getCollectionContent().execute(collectionId, userId);

    return ApiResponse.success(content, messages.success.fetch);
  }

  /**
   * Add a movie to a collection
   */
  @Post('{id}/movies/{movieId}')
  @Security('adminAuth')
  public async addMovie(@Path() id: string, @Path() movieId: string): Promise<ApiResponse<null>> {
    await useCases.addMovieToCollection().execute(id, movieId);

    return ApiResponse.success(null, messages.success.create);
  }

  /**
   * Add a series to a collection
   */
  @Post('{id}/series/{seriesId}')
  @Security('adminAuth')
  public async addSeries(@Path() id: string, @Path() seriesId: string): Promise<ApiResponse<null>> {
    await useCases.addSeriesToCollection().execute(id, seriesId);

    return ApiResponse.success(null, messages.success.create);
  }

  /**
   * Add an album to a collection
   */
  @Post('{id}/albums/{albumId}')
  @Security('adminAuth')
  public async addAlbum(@Path() id: string, @Path() albumId: string): Promise<ApiResponse<null>> {
    await useCases.addAlbumToCollection().execute(id, albumId);

    return ApiResponse.success(null, messages.success.create);
  }

  /**
   * Remove a movie from a collection
   */
  @Delete('{id}/movies/{movieId}')
  @Security('adminAuth')
  public async removeMovie(
    @Path() id: string,
    @Path() movieId: string,
  ): Promise<ApiResponse<null>> {
    await useCases.removeMovieFromCollection().execute(id, movieId);

    return ApiResponse.success(null, messages.success.delete);
  }

  /**
   * Remove a series from a collection
   */
  @Delete('{id}/series/{seriesId}')
  @Security('adminAuth')
  public async removeSeries(
    @Path() id: string,
    @Path() seriesId: string,
  ): Promise<ApiResponse<null>> {
    await useCases.removeSeriesFromCollection().execute(id, seriesId);

    return ApiResponse.success(null, messages.success.delete);
  }

  /**
   * Remove an album from a collection
   */
  @Delete('{id}/albums/{albumId}')
  @Security('adminAuth')
  public async removeAlbum(
    @Path() id: string,
    @Path() albumId: string,
  ): Promise<ApiResponse<null>> {
    await useCases.removeAlbumFromCollection().execute(id, albumId);

    return ApiResponse.success(null, messages.success.delete);
  }

  /**
   * Reorder items in a collection
   */
  @Post('{id}/items/order')
  @Security('adminAuth')
  public async reorderContent(
    @Path() id: string,
    @Body() body: ReorderContentDTO,
  ): Promise<ApiResponse<null>> {
    const { orderedItems } = body;

    await useCases.reorderCollectionItems().execute(id, orderedItems);

    return ApiResponse.success(null, messages.success.order);
  }

  /**
   * Get collection by ID
   */
  @Get('{id}')
  @Security('cookieAuth')
  public async get(@Path() id: string): Promise<ApiResponse<Collection | null>> {
    const collection = await useCases.getCollectionById().execute(id);
    return ApiResponse.success(collection, messages.success.fetch);
  }

  /**
   * Update collection details
   */
  @Patch('{id}')
  @Security('adminAuth')
  public async update(
    @Path() id: string,
    @Body() body: UpdateCollectionDTO,
  ): Promise<ApiResponse<Collection>> {
    const result = await useCases.updateCollection().execute(id, body);

    return ApiResponse.success(result, messages.success.update);
  }

  /**
   * Delete a collection
   */
  @Delete('{id}')
  @Security('adminAuth')
  public async delete(@Path() id: string): Promise<ApiResponse<null>> {
    await useCases.deleteCollection().execute(id);

    return ApiResponse.success(null, messages.success.delete);
  }
}
