import catchAsync from "@/utils/catchAsync";
import express from "express";
import { SeriesController } from "../controllers/SeriesController";

const router = express.Router();

router.post(
  "/refreshShowMetadata",
  catchAsync(SeriesController.refreshMetadata)
);
router.post("/updateShowId", catchAsync(SeriesController.updateShowId));
router.post(
  "/updateEpisodeGroup",
  catchAsync(SeriesController.updateEpisodeGroup)
);
router.put("/show/:id", catchAsync(SeriesController.update));
router.delete("/series/:id", catchAsync(SeriesController.delete));

export default router;
