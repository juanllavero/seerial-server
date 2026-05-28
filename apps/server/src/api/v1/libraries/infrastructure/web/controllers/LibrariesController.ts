import type { LibraryItem } from '@seerial/domain';
import type { Request as ExpressRequest } from 'express';
import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Path,
  Post,
  Query,
  Request,
  Route,
  Security,
  Tags,
} from 'tsoa';
import { useCases } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { NotFoundException } from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { ApiResponse } from '@/api/v1/shared/infrastructure/web/http/APIResponse';
import { messages } from '@/config/messages';
import { getUserId } from '@/utils/auth';
import type {
  CreateLibraryDTO,
  ReorderItemsDTO,
  ReorderLibrariesDTO,
  UpdateLibraryDTO,
} from '../../../application/dtos/LibraryDTOs';
import type { Library } from '../../../domain/Library';

@Route('libraries')
@Tags('Libraries')
export class LibrariesController extends Controller {
  /**
   * Get all libraries
   */
  @Get()
  @Security('adminAuth')
  public async getAll(): Promise<ApiResponse<Library[]>> {
    const libraries = await useCases.getLibraries().execute();
    return ApiResponse.success(libraries, messages.success.fetch);
  }

  /**
   * Get library by ID
   */
  @Get('{id}')
  @Security('adminAuth')
  public async getById(@Path() id: string): Promise<ApiResponse<Library>> {
    const library = await useCases.getLibrary().execute(id);
    if (!library) {
      throw new NotFoundException(messages.errors.notFound.library);
    }

    return ApiResponse.success(library, messages.success.fetch);
  }

  /**
   * Get library content
   */
  @Get('{id}/content')
  @Security('adminAuth')
  public async getContent(
    @Path() id: string,
    @Request() req: ExpressRequest,
    @Query() watched?: boolean,
  ): Promise<ApiResponse<LibraryItem[]>> {
    const userId = getUserId(req);
    const content = await useCases.getLibraryContent().execute(id, userId, watched);
    if (!content) {
      throw new NotFoundException(messages.errors.notFound.library);
    }

    return ApiResponse.success(content, messages.success.fetch);
  }

  /**
   * Start library scan
   */
  @Post('{id}/scan')
  @Security('adminAuth')
  public async startScan(@Path() id: string): Promise<ApiResponse<Library>> {
    const library = await useCases.getLibrary().execute(id);

    if (!library) {
      throw new NotFoundException(messages.errors.notFound.library);
    }

    await useCases.scanLibrary().execute(library, false);

    return ApiResponse.success(library, messages.success.scan);
  }

  /**
   * Create a new library
   */
  @Post()
  @Security('adminAuth')
  public async create(@Body() body: CreateLibraryDTO): Promise<ApiResponse<Library>> {
    // The scanLibrary useCase expects a full Library object, so we need to create a temporary one
    const tempLibrary = {
      ...body,
      id: '',
      order: 0,
      hidden: false,
      analyzedFiles: {},
      analyzedFolders: {},
      backgroundSrc: '',
      series: [],
      movies: [],
      albums: [],
      collections: [],
      numberOfItems: 0,
    };

    const library = await useCases.scanLibrary().execute(tempLibrary, true);

    if (!library) {
      throw new NotFoundException(messages.errors.notFound.library);
    }

    return ApiResponse.success(library, messages.success.create);
  }

  /**
   * Update library details
   */
  @Patch('{id}')
  @Security('adminAuth')
  public async update(
    @Path() id: string,
    @Body() body: UpdateLibraryDTO,
  ): Promise<ApiResponse<Library>> {
    const result = await useCases.updateLibrary().execute(id, body);

    return ApiResponse.success(result, messages.success.update);
  }

  /**
   * Delete a library
   */
  @Delete('{id}')
  @Security('adminAuth')
  public async delete(@Path() id: string): Promise<ApiResponse<null>> {
    await useCases.deleteLibrary().execute(id);

    return ApiResponse.success(null, messages.success.delete);
  }

  /**
   * Reorder libraries
   */
  @Patch('order')
  @Security('adminAuth')
  public async reorder(@Body() body: ReorderLibrariesDTO): Promise<ApiResponse<boolean>> {
    const { orderedLibraryIds } = body;
    const result = await useCases.reorderLibraries().execute(orderedLibraryIds);

    return ApiResponse.success(result, messages.success.order);
  }

  /**
   * Reorder library items
   */
  @Patch('{id}/order')
  @Security('adminAuth')
  public async reorderItems(
    @Path() id: string,
    @Body() body: ReorderItemsDTO,
  ): Promise<ApiResponse<boolean>> {
    const { orderedItems } = body;

    const result = await useCases.reorderLibraryItems().execute(id, orderedItems);

    return ApiResponse.success(result, messages.success.order);
  }
}
