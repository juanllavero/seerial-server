import { MediaDetailsManager } from "@/managers/MediaDetailsManager";
import catchAsync from "@/utils/catchAsync";
import express, { NextFunction, Request, Response } from "express";

const router = express.Router();

router.get(
  "/musicExtras/:collectionId",
  catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { collectionId } = req.params;
    const extras = await MediaDetailsManager.findMusicExtras(collectionId);
    res.status(200).json(extras);
  })
);

export default router;
