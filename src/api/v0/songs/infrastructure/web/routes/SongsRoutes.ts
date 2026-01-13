import catchAsync from "@/utils/catchAsync";
import express from "express";
import { SongsController } from "../controllers/SongsController";

const router = express.Router();

router.put("/songs/:id", catchAsync(SongsController.update));
router.delete("/songs/:id", catchAsync(SongsController.delete));
router.get("songs/:id/lyrics", catchAsync(SongsController.getSongsLyrics));
router.post("/songs/lyrics", catchAsync(SongsController.addSongsLyrics));

export default router;
