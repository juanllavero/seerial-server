import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { DownloaderManager } from "@/managers/DownloaderManager";
import catchAsync from "@/utils/catchAsync";
import { downloadImage, isValidURL } from "@/utils/utils";
import { NextFunction, Request, Response, Router } from "express";
import path from "path";
import { fileSystemService } from "../../adapters/di/container";

const router = Router();

// Download video
router.post(
  "/downloadVideo",
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

// Download music
router.post(
  "/downloadMusic",
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

// Download image
router.post(
  "/downloadImage",
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
