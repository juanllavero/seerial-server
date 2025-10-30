import catchAsync from "@/utils/catchAsync";
import express from "express";
import { AlbumsController } from "../controllers/AlbumsController";

const router = express.Router();

router.put("/album/:id", catchAsync(AlbumsController.update));
router.delete("/album/:id", catchAsync(AlbumsController.delete));

export default router;
