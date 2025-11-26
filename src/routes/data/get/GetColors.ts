import { imageProcessingService } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import catchAsync from "@/utils/catchAsync";
import express, { NextFunction, Request, Response } from "express";

const router = express.Router();

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
