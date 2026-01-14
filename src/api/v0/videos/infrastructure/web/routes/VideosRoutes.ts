import catchAsync from "@/utils/catchAsync";
import express from "express";
import { VideosController } from "../controllers/VideosController";

const router = express.Router();

router.get(
  "/videos/:id/media-info",
  catchAsync(VideosController.updateMediaInfo)
);
router.put(
  "/videos/:id/media-info",
  catchAsync(VideosController.updateMediaInfo)
);
router.put("/videos/:id", catchAsync(VideosController.update));
router.delete("/videos/:id", catchAsync(VideosController.delete));
router.post(
  "/videos/:id/watch-state",
  catchAsync(VideosController.setWatchState)
);

export default router;
