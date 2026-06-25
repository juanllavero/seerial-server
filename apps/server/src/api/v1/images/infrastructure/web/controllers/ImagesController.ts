import nodePath from 'node:path';
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
  useCases,
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
  NotFoundException,
} from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { ApiResponse } from '@/api/v1/shared/infrastructure/web/http/APIResponse';
import { messages } from '@/config/messages';

@Route('images')
@Tags('Images')
export class ImagesController extends Controller {
  private getAllowedImageUploadMimes(): string[] {
    return ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
  }

  private getAllowedImageUploadExtensions(): string[] {
    return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
  }

  private detectImageMime(buffer: Buffer): string | null {
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }

    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return 'image/png';
    }

    if (
      buffer.length >= 4 &&
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38
    ) {
      return 'image/gif';
    }

    if (
      buffer.length >= 12 &&
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return 'image/webp';
    }

    if (
      buffer.length >= 12 &&
      buffer[4] === 0x66 &&
      buffer[5] === 0x74 &&
      buffer[6] === 0x79 &&
      buffer[7] === 0x70 &&
      ((buffer[8] === 0x61 && buffer[9] === 0x76 && buffer[10] === 0x69 && buffer[11] === 0x66) ||
        (buffer[8] === 0x61 && buffer[9] === 0x76 && buffer[10] === 0x69 && buffer[11] === 0x73))
    ) {
      return 'image/avif';
    }

    return null;
  }

  private async getAllowedUploadPaths(): Promise<string[]> {
    const resourcesRoot = fileSystemService.getExternalPath('resources');
    const libraries = await useCases.getLibraries().execute();
    const libraryRoots = libraries.flatMap((library) => library.folders ?? []).filter(Boolean);

    return [resourcesRoot, ...libraryRoots];
  }

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
  @Security('adminAuth')
  public async uploadImage(
    @FormField() destPath: string,
    @UploadedFile() image: Express.Multer.File,
  ): Promise<ApiResponse<null>> {
    const allowedMimes = this.getAllowedImageUploadMimes();
    const allowedExtensions = this.getAllowedImageUploadExtensions();

    // Validate declared MIME type
    if (!allowedMimes.includes(image.mimetype)) {
      throw new BadRequestException();
    }

    // Validate file name
    if (!isValidFileName(image.originalname)) {
      throw new BadRequestException();
    }

    const ext = nodePath.extname(image.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new BadRequestException();
    }

    // Validate magic bytes to avoid trusting client-declared MIME type.
    const detectedMime = this.detectImageMime(image.buffer);
    if (!detectedMime || detectedMime !== image.mimetype) {
      throw new BadRequestException();
    }

    // Resolve relative paths to LOCAL_DATA_PATH so callers can pass either absolute
    // content-folder paths or LOCAL_DATA_PATH-relative paths (e.g. 'resources/collections/…')
    const resolvedDestPath = nodePath.isAbsolute(destPath)
      ? destPath
      : fileSystemService.getExternalPath(destPath);

    const allowedUploadPaths = await this.getAllowedUploadPaths();
    const sanitizedDestPath = sanitizeDirectoryPath(resolvedDestPath, allowedUploadPaths, false);

    // Combine the paths
    const finalPath = safeJoinPath(sanitizedDestPath, image.originalname);

    // Ensure destination directory exists
    fileSystemService.createFolder(nodePath.dirname(finalPath));

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
    const decodedImagesPath = decodeURIComponent(imagesPath);

    // Resolve relative paths to LOCAL_DATA_PATH (mirrors uploadImage and getLocalImage behaviour)
    const resolvedImagesPath = nodePath.isAbsolute(decodedImagesPath)
      ? decodedImagesPath
      : fileSystemService.getExternalPath(decodedImagesPath);

    const sanitizedPath = sanitizeDirectoryPath(resolvedImagesPath, getSystemAllowedPaths(), true);

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

    const imagePath = nodePath.isAbsolute(path)
      ? path
      : fileSystemService.getExternalPath(
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

    const imageSource = localPath
      ? await fileSystemService.isFile(localPath) ? localPath : fileSystemService.getExternalPath(
        localPath?.includes('resources/')
          ? localPath
          : fileSystemService.join('resources', localPath ?? ''),
      )
      : url;

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

  /**
   * Stream animated artwork (.mp4) for an album folder
   */
  @Get('animated-artwork')
  @Security('cookieAuthFast')
  public async getAnimatedArtwork(
    @Query() localPath: string,
    @Query() variant?: 'square' | 'tall',
    @Request() req?: ExpressRequest,
  ): Promise<void> {
    const res = this.getResponseFromRequest(req);

    const fileName =
      variant === 'tall' ? 'tall_animated_artwork.mp4' : 'square_animated_artwork.mp4';

    const decodedLocalPath = decodeURIComponent(localPath);

    const folderPath = nodePath.isAbsolute(decodedLocalPath)
      ? decodedLocalPath
      : fileSystemService.getExternalPath(
        decodedLocalPath.includes('resources/')
          ? decodedLocalPath
          : fileSystemService.join('resources', decodedLocalPath),
      );

    const sanitizedFolder = sanitizeDirectoryPath(folderPath, getSystemAllowedPaths(), true);

    const filePath = nodePath.join(sanitizedFolder, fileName);

    const exists = await fileSystemService.exists(filePath);
    if (!exists) {
      throw new NotFoundException();
    }

    const stat = await fileSystemService.getFileStats(filePath);
    if (!stat?.isFile()) {
      throw new NotFoundException();
    }
    const fileSize = stat.size;
    const range = (req as ExpressRequest | undefined)?.headers?.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = Number.parseInt(parts[0], 10);
      const end = parts[1] ? Number.parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });

      fileSystemService.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });

      fileSystemService.createReadStream(filePath).pipe(res);
    }
  }
}
