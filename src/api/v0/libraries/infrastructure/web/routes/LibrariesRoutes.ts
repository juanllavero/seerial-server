import catchAsync from "@/utils/catchAsync";
import express from "express";
import { LibrariesController } from "../controllers/LibrariesController";

const router = express.Router();

router.post("/libraries", catchAsync(LibrariesController.create));
router.post("/libraries/order", catchAsync(LibrariesController.reorder));
router.post(
  "/libraries/:id/order",
  catchAsync(LibrariesController.reorderItems)
);
router.put("/libraries/:id", catchAsync(LibrariesController.update));
router.delete("/libraries/:id", catchAsync(LibrariesController.delete));

export default router;
