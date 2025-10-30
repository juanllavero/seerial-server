import catchAsync from "@/utils/catchAsync";
import express from "express";
import { CollectionsController } from "../controllers/CollectionsController";

const router = express.Router();

router.post(
  "/collections/reorder-content",
  catchAsync(CollectionsController.reorderContent)
);
router.put("/collection/:id", catchAsync(CollectionsController.update));
router.delete("/collection/:id", catchAsync(CollectionsController.delete));

export default router;
