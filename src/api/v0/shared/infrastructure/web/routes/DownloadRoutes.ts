import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { DownloaderManager } from "@/managers/DownloaderManager";
import catchAsync from "@/utils/catchAsync";
import { downloadImage, isValidURL } from "@/utils/utils";
import { NextFunction, Request, Response, Router } from "express";
import path from "path";
import { fileSystemService } from "../../adapters/di/container";

const router = Router();

/**
 * @swagger
 * /downloads/video:
 *   post:
 *     summary: Download a video from URL
 *     tags: [Downloads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *               - downloadFolder
 *               - fileName
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: Video URL to download
 *               downloadFolder:
 *                 type: string
 *                 description: Destination folder path
 *               fileName:
 *                 type: string
 *                 description: Output file name
 *     responses:
 *       200:
 *         description: Video downloaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Download completed successfully
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Download failed
 */
router.post(
  "/downloads/video",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { url, downloadFolder, fileName } = req.body;

    if (!url || !downloadFolder || !fileName) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    await DownloaderManager.downloadVideo(url, downloadFolder, fileName);

    return res.status(200).json({ message: messages.success.download });
  })
);

/**
 * @swagger
 * /downloads/music:
 *   post:
 *     summary: Download audio/music from URL
 *     tags: [Downloads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *               - downloadFolder
 *               - fileName
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: Audio URL to download
 *               downloadFolder:
 *                 type: string
 *                 description: Destination folder path
 *               fileName:
 *                 type: string
 *                 description: Output file name
 *     responses:
 *       200:
 *         description: Audio downloaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Download completed successfully
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Download failed
 */
router.post(
  "/downloads/music",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { url, downloadFolder, fileName } = req.body;

    if (!url || !downloadFolder || !fileName) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    await DownloaderManager.downloadAudio(url, downloadFolder, fileName);

    return res.status(200).json({ message: messages.success.download });
  })
);

/**
 * @swagger
 * /downloads/image:
 *   post:
 *     summary: Download an image from URL
 *     tags: [Downloads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *               - downloadFolder
 *               - fileName
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: Image URL to download
 *               downloadFolder:
 *                 type: string
 *                 description: Destination folder path
 *               fileName:
 *                 type: string
 *                 description: Output file name (extension will be added if missing)
 *     responses:
 *       200:
 *         description: Image downloaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Download completed successfully
 *       400:
 *         description: Missing required parameters or invalid URL
 *       500:
 *         description: Download failed
 */
router.post(
  "/downloads/image",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let { url, downloadFolder, fileName } = req.body;

    if (!url || !downloadFolder || !fileName) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    if (!isValidURL(url)) {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }

    // If the file name doesn't have an extension, add .jpg
    if (!path.extname(fileName)) {
      fileName += ".jpg";
    }

    await downloadImage(
      url,
      path.join(fileSystemService.resourcesPath, downloadFolder, fileName)
    );

    return res.status(200).json({ message: messages.success.download });
  })
);

export default router;
