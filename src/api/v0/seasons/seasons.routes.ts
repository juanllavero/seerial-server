import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import catchAsync from "@/utils/catchAsync";
import express, { NextFunction, Request, Response } from "express";
import { deleteSeason, updateSeason } from "./seasons.service";

const router = express.Router();

// Update Season
router.put(
  "/season/:id",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const updatedSeasonData = req.body;
    const id = req.params.id;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const updatedSeason = await updateSeason(id, updatedSeasonData);
    return res.status(200).json({
      status: "success",
      message: messages.success.update,
      data: updatedSeason,
    });
  })
);

// Delete Season
router.delete(
  "/season/:id",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const deleted = await deleteSeason(id);

    if (!deleted) {
      return next(new ApiError(404, messages.errors.delete));
    }

    res.status(200).json({ message: messages.success.delete });
  })
);

export default router;
