import catchAsync from "@/utils/catchAsync";
import express from "express";
import { LibrariesController } from "../controllers/LibrariesController";

const router = express.Router();

router.post("/addLibrary", catchAsync(LibrariesController.create));
router.post("/libraries/reorder", catchAsync(LibrariesController.reorder));
router.post("/library/reorder", catchAsync(LibrariesController.reorderItems));
router.put("/library/:id", catchAsync(LibrariesController.update));
router.delete("/libraries/:id", catchAsync(LibrariesController.delete));

export default router;
