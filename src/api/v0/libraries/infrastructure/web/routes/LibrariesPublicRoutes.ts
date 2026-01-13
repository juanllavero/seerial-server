import catchAsync from "@/utils/catchAsync";
import express from "express";
import { LibrariesController } from "../controllers/LibrariesController";

const router = express.Router();

router.get("/libraries/:id", catchAsync(LibrariesController.getById));
router.get("/libraries", catchAsync(LibrariesController.getAll));
router.get(
  "/libraries/:id/content",
  catchAsync(LibrariesController.getContent)
);
router.get("/libraries/:id/scan", catchAsync(LibrariesController.startScan));

export default router;
