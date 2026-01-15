import { MessageResponse } from "@/api/v1/shared/application/dtos/DTOs";
import { collectionsRepo } from "@/api/v1/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Put,
  Route,
  Security,
  Tags,
} from "tsoa";
import {
  CollectionResponse,
  MusicExtrasDTO,
  ReorderContentDTO,
  UpdateCollectionDTO,
} from "../../../application/dtos/CollectionDTOs";
import { DeleteCollectionUseCase } from "../../../application/usecases/DeleteCollectionUseCase";
import { GetMusicExtrasUseCase } from "../../../application/usecases/GetMusicExtrasUseCase";
import { ReorderCollectionItemsUseCase } from "../../../application/usecases/ReorderCollectionItemsUseCase";
import { UpdateCollectionUseCase } from "../../../application/usecases/UpdateCollectionUseCase";

@Route("collections")
@Tags("Collections")
export class CollectionsController extends Controller {
  /**
   * Get music extras for a collection
   */
  @Get("{collectionId}/music-extras")
  @Security("adminAuth")
  public async getMusicExtras(
    @Path() collectionId: string
  ): Promise<MusicExtrasDTO> {
    const useCase = new GetMusicExtrasUseCase(collectionsRepo);
    return await useCase.execute(collectionId);
  }

  /**
   * Reorder items in a collection
   */
  @Post("{id}/items/order")
  @Security("adminAuth")
  public async reorderContent(
    @Path() id: string,
    @Body() body: ReorderContentDTO
  ): Promise<MessageResponse> {
    const { orderedItems } = body;

    const useCase = new ReorderCollectionItemsUseCase(collectionsRepo);
    await useCase.execute(id, orderedItems);

    return { message: messages.success.order };
  }

  /**
   * Update collection details
   */
  @Put("{id}")
  @Security("adminAuth")
  public async update(
    @Path() id: string,
    @Body() body: UpdateCollectionDTO
  ): Promise<CollectionResponse> {
    const useCase = new UpdateCollectionUseCase(collectionsRepo);
    const result = await useCase.execute(id, body);

    return {
      status: "success",
      message: messages.success.update,
      data: result,
    };
  }

  /**
   * Delete a collection
   */
  @Delete("{id}")
  @Security("adminAuth")
  public async delete(@Path() id: string): Promise<MessageResponse> {
    const useCase = new DeleteCollectionUseCase(collectionsRepo);
    const deleted = await useCase.execute(id);

    if (!deleted) {
      throw new ApiError(404, messages.errors.delete);
    }

    return { message: messages.success.delete };
  }
}
