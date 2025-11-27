import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { MediaManager } from "@/managers/MediaManager";
import catchAsync from "@/utils/catchAsync";
import { NextFunction, Request, Response, Router } from "express";

const router = Router();

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
