import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { FilesManager } from "@/managers/FilesManager";
import { ImageManager } from "@/managers/ImageManager";
import { SanitizationManager } from "@/managers/SanitizationManager";
import catchAsync from "@/utils/catchAsync";
import express, { NextFunction, Request, Response } from "express";
import path from "path";

const router = express.Router();

router.use(
  "/img",
  express.static(path.join(FilesManager.resourcesPath, "img"))
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

      const images = await ImageManager.getDirectoryListing(sanitizedPath);
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

      await ImageManager.streamLocalImage({
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

    await ImageManager.streamRemoteImage({
      url,
      res,
      width: width ? parseInt(width as string, 10) : undefined,
      height: height ? parseInt(height as string, 10) : undefined,
    });
  })
);

export default router;
