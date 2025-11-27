import {
  fileSystemService,
  imageProcessingService,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { SanitizationManager } from "@/managers/SanitizationManager";
import catchAsync from "@/utils/catchAsync";
import { upload } from "@/utils/multer";
import express, { NextFunction, Request, Response } from "express";
import path from "path";

const router = express.Router();

router.use(
  "/img",
  express.static(path.join(fileSystemService.resourcesPath, "img"))
);

// Upload image
router.post(
  "/uploadImage",
  upload,
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const destPath = req.body.destPath;

    if (!destPath) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    try {
      const sanitizedDestPath = SanitizationManager.sanitizeDirectoryPath(
        destPath,
        SanitizationManager.getSystemAllowedPaths(),
        false
      );

      if (Array.isArray(req.files) || !req.files?.image) {
        return next(
          new ApiError(400, messages.errors.validation.noImageReceived)
        );
      }

      const file = req.files.image[0];

      // Validate file name
      if (!SanitizationManager.isValidFileName(file.originalname)) {
        return next(new ApiError(400, "Invalid file name"));
      }

      // Combine the paths
      const finalPath = SanitizationManager.safeJoinPath(
        sanitizedDestPath,
        file.originalname
      );

      res.status(200).send({
        status: "success",
        message: `Image uploaded successfully to ${finalPath}`,
      });
    } catch (error: any) {
      return next(new ApiError(400, `Invalid path: ${error.message}`));
    }
  })
);

/**
 * @route GET /images
 * @desc Lists all images in a given directory path.
 */
router.get(
  "/images",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const imagesPath = req.query.path as string;

    if (!imagesPath) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
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
      return res.status(200).json(images);
    } catch (error: any) {
      return next(new ApiError(400, `Invalid path: ${error.message}`));
    }
  })
);

/**
 * @route GET /image
 * @desc Serves a resized and compressed local image.
 */
router.get(
  "/image",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { path: imagePath, width, height } = req.query;

    if (typeof imagePath !== "string" || imagePath.trim() === "") {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    try {
      const sanitizedPath = SanitizationManager.sanitizeImagePath(
        imagePath,
        SanitizationManager.getSystemAllowedPaths(),
        true // Must exist
      );

      await imageProcessingService.streamLocalImage({
        filePath: sanitizedPath,
        res,
        width: width ? parseInt(width as string, 10) : undefined,
        height: height ? parseInt(height as string, 10) : undefined,
      });
    } catch (error: any) {
      return next(new ApiError(400, `Invalid image path: ${error.message}`));
    }
  })
);

/**
 * @route GET /compress-image
 * @desc Downloads, compresses, and serves an image from a URL.
 */
router.get(
  "/compress-image",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { url, width, height } = req.query;

    if (typeof url !== "string" || url.trim() === "") {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    await imageProcessingService.streamRemoteImage({
      url,
      res,
      width: width ? parseInt(width as string, 10) : undefined,
      height: height ? parseInt(height as string, 10) : undefined,
    });
  })
);

/**
 * @route GET /image-colors
 * @desc Extracts a vibrant color palette from an image and returns it along with a CSS gradient.
 */
router.get(
  "/image-colors",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { url, localPath, minLight, maxLight, sat } = req.query;

    if (!url && !localPath) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    const imageSource = (localPath as string) || (url as string);

    const options = {
      targetLightness: {
        min: minLight ? parseFloat(minLight as string) : 0.04,
        max: maxLight ? parseFloat(maxLight as string) : 0.09,
      },
      saturationFactor: sat ? parseFloat(sat as string) : 1.0,
    };

    const result = await imageProcessingService.getImageColorPalette(
      imageSource,
      options
    );

    return res.status(200).json(result);
  })
);

/**
 * @route GET /transparent-image-effect
 * @desc Applies a transparent fade effect to an image and returns it as a PNG.
 */
router.get(
  "/transparent-image-effect",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { url, localPath, width, height } = req.query;

    if ((!url && !localPath) || !width || !height) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    const finalWidth = parseInt(width as string, 10);
    const finalHeight = parseInt(height as string, 10);

    if (isNaN(finalWidth) || isNaN(finalHeight)) {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }

    const imageSource = (localPath as string) || (url as string);

    const finalImageBuffer =
      await imageProcessingService.createTransparentImage(
        imageSource,
        finalWidth,
        finalHeight
      );

    res.setHeader("Content-Type", "image/png");
    return res.send(finalImageBuffer);
  })
);

export default router;
