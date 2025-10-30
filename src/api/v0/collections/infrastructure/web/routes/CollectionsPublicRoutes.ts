import catchAsync from "@/utils/catchAsync";
import express from "express";
import { CollectionsController } from "../controllers/CollectionsController";

const router = express.Router();

router.get(
  "/musicExtras/:collectionId",
  catchAsync(CollectionsController.getMusicExtras)
);

export default router;
