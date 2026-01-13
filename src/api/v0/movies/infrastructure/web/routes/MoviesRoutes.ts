import catchAsync from "@/utils/catchAsync";
import express from "express";
import { MoviesController } from "../controllers/MoviesController";

const router = express.Router();

router.post(
  "/movies/:id/metadata",
  catchAsync(MoviesController.refreshMovieMetadata)
);
router.post(
  "/movies/:id/identification",
  catchAsync(MoviesController.changeIdentification)
);
router.put("/movies/:id", catchAsync(MoviesController.update));
router.delete("/movies/:id", catchAsync(MoviesController.delete));

export default router;
