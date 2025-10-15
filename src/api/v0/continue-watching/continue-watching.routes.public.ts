import catchAsync from "@/utils/catchAsync";
import { getUserId } from "@/utils/utils";
import express, { NextFunction, Request, Response } from "express";
import { getContinueWatchingVideos } from "./continue-watching.service";

const router = express.Router();

router.get(
  "/continueWatching",
  catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const videos = await getContinueWatchingVideos(getUserId(req));
    res.status(200).json(videos);
  })
);

export default router;
