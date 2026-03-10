import path from 'path';
import { Controller, FormField, Get, Post, Query, Route, Security, Tags, UploadedFile } from 'tsoa';
import {
  fileSystemService,
  imageProcessingService,
} from '@/api/v1/shared/infrastructure/adapters/di/container';
import { SanitizationService } from '@/api/v1/shared/infrastructure/services/SanitizationService';
import {
  BadRequestException,
  NotEnoughParamsException,
} from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { ApiResponse } from '@/api/v1/shared/infrastructure/web/http/APIResponse';
import { messages } from '@/config/messages';

@Route('images')
@Tags('Images')
export class ImagesController extends Controller {
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
    if (!SanitizationService.isValidFileName(image.originalname)) {
      throw new BadRequestException();
    }

    const sanitizedDestPath = SanitizationService.sanitizeDirectoryPath(
      destPath,
      SanitizationService.getSystemAllowedPaths(),
      false,
    );

    // Combine the paths
    const finalPath = SanitizationService.safeJoinPath(sanitizedDestPath, image.originalname);

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
  public async getDirectoryListing(@Query() path: string): Promise<ApiResponse<any>> {
    const imagesPath = path;

    const sanitizedPath = SanitizationService.sanitizeDirectoryPath(
      decodeURIComponent(imagesPath),
      SanitizationService.getSystemAllowedPaths(),
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
  ): Promise<void> {
    const sanitizedPath = SanitizationService.sanitizeImagePath(
      path,
      SanitizationService.getSystemAllowedPaths(),
      true, // Must exist
    );

    await imageProcessingService.streamLocalImage({
      filePath: sanitizedPath,
      res: (this as any).response,
      width: width ? parseInt(width as any, 10) : undefined,
      height: height ? parseInt(height as any, 10) : undefined,
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
  ): Promise<void> {
    await imageProcessingService.streamRemoteImage({
      url,
      res: (this as any).response,
      width: width ? parseInt(width as any, 10) : undefined,
      height: height ? parseInt(height as any, 10) : undefined,
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
  ): Promise<ApiResponse<any>> {
    if (!url && !localPath) {
      throw new NotEnoughParamsException();
    }

    const imageSource = (localPath as string) || (url as string);

    const options = {
      targetLightness: {
        min: minLight ? minLight : 0.04,
        max: maxLight ? maxLight : 0.09,
      },
      saturationFactor: sat ? sat : 1.0,
    };

    const result = await imageProcessingService.getImageColorPalette(imageSource, options);

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
  ): Promise<void> {
    if ((!url && !localPath) || !width || !height) {
      throw new NotEnoughParamsException();
    }

    const finalWidth = width;
    const finalHeight = height;

    if (isNaN(finalWidth) || isNaN(finalHeight)) {
      throw new BadRequestException();
    }

    const imageSource = (localPath as string) || (url as string);

    const finalImageBuffer = await imageProcessingService.createTransparentImage(
      imageSource,
      finalWidth,
      finalHeight,
    );

    const res = (this as any).response;
    res.setHeader('Content-Type', 'image/png');
    res.send(finalImageBuffer);
  }
}
