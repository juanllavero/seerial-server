import { Body, Controller, Delete, Get, Path, Post, Put, Route, Security, Tags } from 'tsoa';
import { useCases } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { ApiResponse } from '@/api/v1/shared/infrastructure/web/http/APIResponse';
import { messages } from '@/config/messages';
import type {
  MusicExtrasDTO,
  ReorderContentDTO,
  UpdateCollectionDTO,
} from '../../../application/dtos/CollectionDTOs';
import type { Collection } from '../../../domain/Collection';

@Route('collections')
@Tags('Collections')
export class CollectionsController extends Controller {
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
  @Put('{id}')
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
