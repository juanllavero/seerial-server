import catchAsync from "@/utils/catchAsync";
import express from "express";
import { EpisodesController } from "../controllers/EpisodesController";

const router = express.Router();

router.put("/episode/:id", catchAsync(EpisodesController.update));
router.delete("/episode/:id", catchAsync(EpisodesController.delete));
router.post(
  "/episode/:id/watch-state",
  catchAsync(EpisodesController.setWatchState)
);

export default router;
