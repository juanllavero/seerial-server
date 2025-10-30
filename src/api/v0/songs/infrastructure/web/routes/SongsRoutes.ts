import catchAsync from "@/utils/catchAsync";
import express from "express";
import { SongsController } from "../controllers/SongsController";

const router = express.Router();

router.put("/song/:id", catchAsync(SongsController.update));
router.delete("/song/:id", catchAsync(SongsController.delete));

export default router;
