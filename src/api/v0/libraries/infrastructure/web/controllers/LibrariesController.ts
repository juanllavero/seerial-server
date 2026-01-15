import { MessageResponse } from "@/api/v0/shared/application/dtos/DTOs";
import { useCases } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { getUserId } from "@/utils/utils";
import { Request as ExpressRequest } from "express";
import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Put,
  Query,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import {
  CreateLibraryDTO,
  LibrariesResponse,
  LibraryResponse,
  ReorderItemsDTO,
  ReorderLibrariesDTO,
  UpdateLibraryDTO,
} from "../../../application/dtos/LibraryDTOs";

@Route("libraries")
@Tags("Libraries")
export class LibrariesController extends Controller {
  /**
   * Get all libraries
   */
  @Get()
  @Security("adminAuth")
  public async getAll(): Promise<LibrariesResponse> {
    const libraries = await useCases.getLibraries().execute();
    return {
      status: "success",
      message: messages.success.update,
      data: libraries,
    };
  }

  /**
   * Get library by ID
   */
  @Get("{id}")
  @Security("adminAuth")
  public async getById(@Path() id: string): Promise<LibraryResponse> {
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

    const library = await useCases.getLibrary().execute(id);
    if (!library) {
      throw new ApiError(404, messages.errors.notFound.library);
    }

    return {
      status: "success",
      message: messages.success.fetch,
      data: library,
    };
  }

  /**
   * Get library content
   */
  @Get("{id}/content")
  @Security("adminAuth")
  public async getContent(
    @Path() id: string,
    @Query() type: string,
    @Request() req: ExpressRequest,
    @Query() flat?: string
  ): Promise<LibraryResponse> {
    const userId = getUserId(req);
    if (!id || !type) {
      throw new ApiError(400, messages.errors.validation.invalidData);
    }

    const content = await useCases
      .getLibraryContent()
      .execute(id, type, userId, flat ?? "false");
    if (!content) {
      throw new ApiError(404, messages.errors.notFound.library);
    }

    return {
      status: "success",
      message: messages.success.fetch,
      data: content,
    };
  }

  /**
   * Start library scan
   */
  @Get("{id}/scan")
  @Security("adminAuth")
  public async startScan(@Path() id: string): Promise<LibraryResponse> {
    if (!id) {
      throw new ApiError(400, messages.errors.validation.invalidData);
    }

    const library = await useCases.getLibrary().execute(id);

    if (!library) {
      throw new ApiError(404, messages.errors.notFound.library);
    }

    await useCases.scanLibrary().execute(library, false);

    return {
      status: "success",
      message: messages.success.scan,
      data: library,
    };
  }

  /**
   * Create a new library
   */
  @Post()
  @Security("adminAuth")
  public async create(
    @Body() body: CreateLibraryDTO
  ): Promise<LibraryResponse> {
    // The scanLibrary useCase expects a full Library object, so we need to create a temporary one
    const tempLibrary = {
      ...body,
      id: "",
      order: 0,
      hidden: false,
      analyzedFiles: {},
      analyzedFolders: {},
      backgroundSrc: "",
      series: [],
      movies: [],
      albums: [],
      collections: [],
      numberOfItems: 0,
    };

    const library = await useCases.scanLibrary().execute(tempLibrary, true);

    if (!library) {
      throw new ApiError(404, messages.errors.create);
    }

    return {
      status: "success",
      message: messages.success.create,
      data: library,
    };
  }

  /**
   * Update library details
   */
  @Put("{id}")
  @Security("adminAuth")
  public async update(
    @Path() id: string,
    @Body() body: UpdateLibraryDTO
  ): Promise<LibraryResponse> {
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

    const result = await useCases.updateLibrary().execute(id, body);

    return {
      status: "success",
      message: messages.success.update,
      data: result,
    };
  }

  /**
   * Delete a library
   */
  @Delete("{id}")
  @Security("adminAuth")
  public async delete(@Path() id: string): Promise<MessageResponse> {
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

    await useCases.deleteLibrary().execute(id);

    return { message: messages.success.delete };
  }

  /**
   * Reorder libraries
   */
  @Post("order")
  @Security("adminAuth")
  public async reorder(
    @Body() body: ReorderLibrariesDTO
  ): Promise<LibraryResponse> {
    const { orderedLibraryIds } = body;
    if (!orderedLibraryIds) {
      throw new ApiError(400, messages.errors.validation.invalidData);
    }

    const result = await useCases.reorderLibraries().execute(orderedLibraryIds);

    if (!result) {
      throw new ApiError(500, messages.errors.order);
    }

    return {
      status: "success",
      message: messages.success.order,
      data: result,
    };
  }

  /**
   * Reorder library items
   */
  @Post("{id}/order")
  @Security("adminAuth")
  public async reorderItems(
    @Path() id: string,
    @Body() body: ReorderItemsDTO
  ): Promise<LibraryResponse> {
    const { orderedItems } = body;

    if (!id || !Array.isArray(orderedItems)) {
      throw new ApiError(400, messages.errors.validation.invalidData);
    }

    const result = await useCases
      .reorderLibraryItems()
      .execute(id, orderedItems);

    if (!result) {
      throw new ApiError(500, messages.errors.order);
    }

    return {
      status: "success",
      message: messages.success.order,
      data: result,
    };
  }
}
