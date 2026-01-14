import catchAsync from "@/utils/catchAsync";
import express from "express";
import { SeasonsController } from "../controllers/SeasonsController";

const router = express.Router();

router.put("/season/:id", catchAsync(SeasonsController.update));
router.delete("/season/:id", catchAsync(SeasonsController.delete));
router.post(
  "/seasons/:id/watch-state",
  catchAsync(SeasonsController.setWatchState)
);

export default router;
