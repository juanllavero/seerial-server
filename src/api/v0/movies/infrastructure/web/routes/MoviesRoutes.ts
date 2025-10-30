import catchAsync from "@/utils/catchAsync";
import express from "express";
import { MoviesController } from "../controllers/MoviesController";

const router = express.Router();

router.post(
  "/refreshMovieMetadata",
  catchAsync(MoviesController.refreshMovieMetadata)
);
router.post("/movieId", catchAsync(MoviesController.changeIdentification));
router.put("/movie/:id", catchAsync(MoviesController.update));
router.delete("/movie/:id", catchAsync(MoviesController.delete));

export default router;
