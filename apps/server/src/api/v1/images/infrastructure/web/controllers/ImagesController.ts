import path from 'node:path';
import type { Request as ExpressRequest, Response } from 'express';
import {
  Controller,
  FormField,
  Get,
  Post,
  Query,
  Request,
  Route,
  Security,
  Tags,
  UploadedFile,
} from 'tsoa';
import {
  fileSystemService,
  imageProcessingService,
} from '@/api/v1/shared/infrastructure/adapters/di/container';
import {
  getSystemAllowedPaths,
  isValidFileName,
  safeJoinPath,
  sanitizeDirectoryPath,
  sanitizeImagePath,
} from '@/api/v1/shared/infrastructure/services/SanitizationService';
import {
  BadRequestException,
  NotEnoughParamsException,
} from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { ApiResponse } from '@/api/v1/shared/infrastructure/web/http/APIResponse';
import { messages } from '@/config/messages';

@Route('images')
@Tags('Images')
export class ImagesController extends Controller {
  private getResponseFromRequest(req?: ExpressRequest): Response {
    if (req?.res) {
      return req.res;
    }

    const context = this as unknown as {
      request?: ExpressRequest;
      response?: Response;
    };

    if (context.response) {
      return context.response;
    }

    if (context.request?.res) {
      return context.request.res;
    }

    throw new Error('Image response object is not available');
  }

  private normalizeDimension(value?: number): number | undefined {
    if (value === undefined) {
      return undefined;
    }

    return Math.trunc(Number(value));
  }

  /**
   * Upload image file
   */
  @Post()
  @Security('cookieAuthFast')
  public async uploadImage(
    @FormField() destPath: string,
    @UploadedFile() image: Express.Multer.File,
  ): Promise<ApiResponse<null>> {
    // Validate file name
    if (!isValidFileName(image.originalname)) {
      throw new BadRequestException();
    }

    const sanitizedDestPath = sanitizeDirectoryPath(destPath, getSystemAllowedPaths(), false);

    // Combine the paths
    const finalPath = safeJoinPath(sanitizedDestPath, image.originalname);

    // Ensure destination directory exists
    fileSystemService.createFolder(path.dirname(finalPath));

    // Write image buffer to the destination path
    await fileSystemService.writeImage(finalPath, image.buffer);

    return ApiResponse.success(null, messages.success.upload);
  }

  /**
   * Get directory listing
   */
  @Get()
  @Security('cookieAuthFast')
  public async getDirectoryListing(@Query() path: string): Promise<ApiResponse<unknown>> {
    const imagesPath = path;

    const sanitizedPath = sanitizeDirectoryPath(
      decodeURIComponent(imagesPath),
      getSystemAllowedPaths(),
      true,
    );

    const images = await imageProcessingService.getDirectoryListing(sanitizedPath);
    return ApiResponse.success(images, messages.success.fetch);
  }

  /**
   * Get local image with optional resizing
   */
  @Get('local')
  @Security('cookieAuthFast')
  public async getLocalImage(
    @Query() path: string,
    @Query() width?: number,
    @Query() height?: number,
    @Request() req?: ExpressRequest,
  ): Promise<void> {
    const res = this.getResponseFromRequest(req);

    const imagePath = fileSystemService.getExternalPath(
      path.includes('resources/') ? path : fileSystemService.join('resources', path),
    );

    const sanitizedPath = sanitizeImagePath(
      imagePath,
      getSystemAllowedPaths(),
      true, // Must exist
    );

    await imageProcessingService.streamLocalImage({
      filePath: sanitizedPath,
      res,
      width: this.normalizeDimension(width),
      height: this.normalizeDimension(height),
    });
  }

  /**
   * Get remote image with optional resizing
   */
  @Get('compressed')
  @Security('cookieAuthFast')
  public async getRemoteImage(
    @Query() url: string,
    @Query() width?: number,
    @Query() height?: number,
    @Request() req?: ExpressRequest,
  ): Promise<void> {
    const res = this.getResponseFromRequest(req);

    await imageProcessingService.streamRemoteImage({
      url,
      res,
      width: this.normalizeDimension(width),
      height: this.normalizeDimension(height),
    });
  }

  /**
   * Get image color palette
   */
  @Get('colors')
  @Security('cookieAuthFast')
  public async getImageColorPalette(
    @Query() url?: string,
    @Query() localPath?: string,
    @Query() minLight?: number,
    @Query() maxLight?: number,
    @Query() sat?: number,
  ): Promise<ApiResponse<unknown>> {
    if (!url && !localPath) {
      throw new NotEnoughParamsException();
    }

    const imageSource = localPath ? fileSystemService.getExternalPath(localPath?.includes('resources/') ? localPath : fileSystemService.join('resources', localPath ?? '')) : url;

    const options = {
      targetLightness: {
        min: minLight ? minLight : 0.04,
        max: maxLight ? maxLight : 0.09,
      },
      saturationFactor: sat ? sat : 1.0,
    };

    const result = await imageProcessingService.getImageColorPalette(imageSource ?? '', options);

    return ApiResponse.success(result, messages.success.fetch);
  }

  /**
   * Create transparent image
   */
  @Get('effects/transparent')
  @Security('cookieAuthFast')
  public async createTransparentImage(
    @Query() width: number,
    @Query() height: number,
    @Query() url?: string,
    @Query() localPath?: string,
  ): Promise<Buffer> {
    if ((!url && !localPath) || !width || !height) {
      throw new NotEnoughParamsException();
    }

    const finalWidth = width;
    const finalHeight = height;

    if (Number.isNaN(finalWidth) || Number.isNaN(finalHeight)) {
      throw new BadRequestException();
    }

    const imageSource = localPath ?? url;

    const finalImageBuffer = await imageProcessingService.createTransparentImage(
      imageSource ?? '',
      finalWidth,
      finalHeight,
    );

    this.setHeader('Content-Type', 'image/png');
    return finalImageBuffer;
  }
}
