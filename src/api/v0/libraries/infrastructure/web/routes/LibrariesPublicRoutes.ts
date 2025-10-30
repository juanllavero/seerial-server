import catchAsync from "@/utils/catchAsync";
import express from "express";
import { LibrariesController } from "../controllers/LibrariesController";

const router = express.Router();

router.get("/library", catchAsync(LibrariesController.getById));
router.get("/libraries", catchAsync(LibrariesController.getAll));
router.get("/library-content", catchAsync(LibrariesController.getContent));
router.get("/library/scan", catchAsync(LibrariesController.startScan));

export default router;
