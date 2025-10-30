import catchAsync from "@/utils/catchAsync";
import express from "express";
import { ContinueWatchingController } from "../controllers/ContinueWatchingController";

const router = express.Router();

router.get(
  "/continueWatching",
  catchAsync(ContinueWatchingController.getVideos)
);

export default router;
