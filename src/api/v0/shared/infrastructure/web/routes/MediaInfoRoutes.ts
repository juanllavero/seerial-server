import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { MediaManager } from "@/managers/MediaManager";
import catchAsync from "@/utils/catchAsync";
import { NextFunction, Request, Response, Router } from "express";

const router = Router();

/**
 * @swagger
 * /media-info/videoInfo:
 *   get:
 *     summary: Get formatted video information
 *     tags: [Media Info]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *     responses:
 *       200:
 *         description: Formatted video information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 duration:
 *                   type: number
 *                   description: Video duration in seconds
 *                 resolution:
 *                   type: string
 *                   description: Video resolution (e.g., "1920x1080")
 *                 bitrate:
 *                   type: number
 *                   description: Video bitrate
 *                 codec:
 *                   type: string
 *                   description: Video codec
 *                 size:
 *                   type: number
 *                   description: File size in bytes
 *                 format:
 *                   type: string
 *                   description: Video format/container
 *       400:
 *         description: Invalid video ID
 *       500:
 *         description: Media info retrieval failed
 */
router.get(
  "/videoInfo",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.query;
    if (typeof id !== "string") {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }

    const videoInfo = await MediaManager.getFormattedVideoInfo(id);

    res.status(200).json(videoInfo);
  })
);

export default router;
