import catchAsync from "@/utils/catchAsync";
import express from "express";
import { WatchListController } from "../controllers/WatchListController";

const router = express.Router();

router.put(
  "/updateWatchState",
  catchAsync(WatchListController.updateWatchState)
);

export default router;
