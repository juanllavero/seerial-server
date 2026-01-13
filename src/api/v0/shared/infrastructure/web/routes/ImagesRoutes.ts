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

/**
 * @swagger
 * /images/uploadImage:
 *   post:
 *     summary: Upload an image file
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - destPath
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload
 *               destPath:
 *                 type: string
 *                 description: Destination path for the uploaded image
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Image uploaded successfully to /path/to/image.jpg
 *       400:
 *         description: Missing parameters or invalid file
 *       500:
 *         description: Upload failed
 */
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
 * @swagger
 * /images:
 *   get:
 *     summary: List images in a directory
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Directory path to list images from
 *     responses:
 *       200:
 *         description: List of images in the directory
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Image file name
 *                   path:
 *                     type: string
 *                     description: Full path to the image
 *                   size:
 *                     type: number
 *                     description: File size in bytes
 *       400:
 *         description: Missing or invalid path parameter
 *       500:
 *         description: Directory listing failed
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
 * @swagger
 * /images/image:
 *   get:
 *     summary: Serve a resized and compressed local image
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Local path to the image file
 *       - in: query
 *         name: width
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Desired width for resizing
 *       - in: query
 *         name: height
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Desired height for resizing
 *     responses:
 *       200:
 *         description: Resized and compressed image
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Missing or invalid path parameter
 *       500:
 *         description: Image processing failed
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
 * @swagger
 * /images/compress-image:
 *   get:
 *     summary: Download, compress, and serve an image from URL
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *           format: uri
 *         description: Image URL to download and compress
 *       - in: query
 *         name: width
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Desired width for resizing
 *       - in: query
 *         name: height
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Desired height for resizing
 *     responses:
 *       200:
 *         description: Compressed and resized image
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Missing or invalid URL
 *       500:
 *         description: Image download or processing failed
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
 * @swagger
 * /images/image-colors:
 *   get:
 *     summary: Extract color palette from an image
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: url
 *         schema:
 *           type: string
 *           format: uri
 *         description: Image URL to analyze (required if localPath not provided)
 *       - in: query
 *         name: localPath
 *         schema:
 *           type: string
 *         description: Local image path to analyze (required if url not provided)
 *       - in: query
 *         name: minLight
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           default: 0.04
 *         description: Minimum lightness for color palette
 *       - in: query
 *         name: maxLight
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           default: 0.09
 *         description: Maximum lightness for color palette
 *       - in: query
 *         name: sat
 *         schema:
 *           type: number
 *           minimum: 0
 *           default: 1.0
 *         description: Saturation factor
 *     responses:
 *       200:
 *         description: Color palette extracted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 colors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Array of color hex codes
 *                 gradient:
 *                   type: string
 *                   description: CSS gradient string
 *                 dominant:
 *                   type: string
 *                   description: Dominant color hex code
 *       400:
 *         description: Missing image source (URL or local path)
 *       500:
 *         description: Image processing failed
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
 * @swagger
 * /images/transparent-image-effect:
 *   get:
 *     summary: Apply transparent fade effect to an image
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: url
 *         schema:
 *           type: string
 *           format: uri
 *         description: Image URL to process (required if localPath not provided)
 *       - in: query
 *         name: localPath
 *         schema:
 *           type: string
 *         description: Local image path to process (required if url not provided)
 *       - in: query
 *         name: width
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Output image width
 *       - in: query
 *         name: height
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Output image height
 *     responses:
 *       200:
 *         description: Image with transparent fade effect
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Missing required parameters or invalid dimensions
 *       500:
 *         description: Image processing failed
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
