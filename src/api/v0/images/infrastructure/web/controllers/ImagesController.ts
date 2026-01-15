import { MessageResponse } from "@/api/v0/shared/application/dtos/DTOs";
import { imageProcessingService } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { SanitizationManager } from "@/managers/SanitizationManager";
import {
  Controller,
  FormField,
  Get,
  Post,
  Query,
  Route,
  Security,
  Tags,
  UploadedFile,
} from "tsoa";

@Route("images")
@Tags("Images")
export class ImagesController extends Controller {
  /**
   * Upload image file
   */
  @Post()
  @Security("cookieAuthFast")
  public async uploadImage(
    @FormField() destPath: string,
    @UploadedFile() image: Express.Multer.File
  ): Promise<MessageResponse> {
    if (!destPath) {
      throw new ApiError(400, messages.errors.validation.notEnoughParams);
    }

    if (!image) {
      throw new ApiError(400, messages.errors.validation.noImageReceived);
    }

    try {
      // Validate file name
      if (!SanitizationManager.isValidFileName(image.originalname)) {
        throw new ApiError(400, "Invalid file name");
      }

      const sanitizedDestPath = SanitizationManager.sanitizeDirectoryPath(
        destPath,
        SanitizationManager.getSystemAllowedPaths(),
        false
      );

      // Combine the paths
      const finalPath = SanitizationManager.safeJoinPath(
        sanitizedDestPath,
        image.originalname
      );

      return {
        message: `Image uploaded successfully to ${finalPath}`,
      };
    } catch (error: any) {
      throw new ApiError(400, `Invalid path: ${error.message}`);
    }
  }

  /**
   * Get directory listing
   */
  @Get()
  @Security("cookieAuthFast")
  public async getDirectoryListing(@Query() path: string): Promise<any> {
    const imagesPath = path;

    if (!imagesPath) {
      throw new ApiError(400, messages.errors.validation.notEnoughParams);
    }

    try {
      const sanitizedPath = SanitizationManager.sanitizeDirectoryPath(
        decodeURIComponent(imagesPath),
        SanitizationManager.getSystemAllowedPaths(),
        true
      );

      const images = await imageProcessingService.getDirectoryListing(
        sanitizedPath
      );
      return images;
    } catch (error: any) {
      throw new ApiError(400, `Invalid path: ${error.message}`);
    }
  }

  /**
   * Get local image with optional resizing
   */
  @Get("local")
  @Security("cookieAuthFast")
  public async getLocalImage(
    @Query() path: string,
    @Query() width?: number,
    @Query() height?: number
  ): Promise<void> {
    if (typeof path !== "string" || path.trim() === "") {
      throw new ApiError(400, messages.errors.validation.notEnoughParams);
    }

    try {
      const sanitizedPath = SanitizationManager.sanitizeImagePath(
        path,
        SanitizationManager.getSystemAllowedPaths(),
        true // Must exist
      );

      await imageProcessingService.streamLocalImage({
        filePath: sanitizedPath,
        res: (this as any).response,
        width: width ? parseInt(width as any, 10) : undefined,
        height: height ? parseInt(height as any, 10) : undefined,
      });
    } catch (error: any) {
      throw new ApiError(400, `Invalid image path: ${error.message}`);
    }
  }

  /**
   * Get remote image with optional resizing
   */
  @Get("compressed")
  @Security("cookieAuthFast")
  public async getRemoteImage(
    @Query() url: string,
    @Query() width?: number,
    @Query() height?: number
  ): Promise<void> {
    if (typeof url !== "string" || url.trim() === "") {
      throw new ApiError(400, messages.errors.validation.notEnoughParams);
    }

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
  @Get("colors")
  @Security("cookieAuthFast")
  public async getImageColorPalette(
    @Query() url?: string,
    @Query() localPath?: string,
    @Query() minLight?: number,
    @Query() maxLight?: number,
    @Query() sat?: number
  ): Promise<any> {
    if (!url && !localPath) {
      throw new ApiError(400, messages.errors.validation.notEnoughParams);
    }

    const imageSource = (localPath as string) || (url as string);

    const options = {
      targetLightness: {
        min: minLight ? minLight : 0.04,
        max: maxLight ? maxLight : 0.09,
      },
      saturationFactor: sat ? sat : 1.0,
    };

    const result = await imageProcessingService.getImageColorPalette(
      imageSource,
      options
    );

    return result;
  }

  /**
   * Create transparent image
   */
  @Get("effects/transparent")
  @Security("cookieAuthFast")
  public async createTransparentImage(
    @Query() width: number,
    @Query() height: number,
    @Query() url?: string,
    @Query() localPath?: string
  ): Promise<void> {
    if ((!url && !localPath) || !width || !height) {
      throw new ApiError(400, messages.errors.validation.notEnoughParams);
    }

    const finalWidth = width;
    const finalHeight = height;

    if (isNaN(finalWidth) || isNaN(finalHeight)) {
      throw new ApiError(400, messages.errors.validation.invalidData);
    }

    const imageSource = (localPath as string) || (url as string);

    const finalImageBuffer =
      await imageProcessingService.createTransparentImage(
        imageSource,
        finalWidth,
        finalHeight
      );

    const res = (this as any).response;
    res.setHeader("Content-Type", "image/png");
    res.send(finalImageBuffer);
  }
}
