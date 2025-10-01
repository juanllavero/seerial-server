import { messages } from "@/config/messages";
import {
  updateAlbum,
  updateCollection,
  updateEpisode,
  updateLibrary,
  updateMovie,
  updateSeason,
  updateSeries,
  updateSong,
  updateVideo,
} from "@/db/update/updateData";
import ApiError from "@/utils/ApiError";
import catchAsync from "@/utils/catchAsync";
import express, { NextFunction, Request, Response } from "express";

const router = express.Router();

// Update Library
router.put(
  "/library/:id",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const updatedLibraryData = req.body;
    const id = req.params.id;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const updatedLibrary = await updateLibrary(id, updatedLibraryData);
    return res.status(200).json({
      status: "success",
      message: messages.success.update,
      data: updatedLibrary,
    });
  })
);

// Update Collection
router.put(
  "/collection/:id",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const updatedCollectionData = req.body;
    const id = req.params.id;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const updatedCollection = await updateCollection(id, updatedCollectionData);
    return res.status(200).json({
      status: "success",
      message: messages.success.update,
      data: updatedCollection,
    });
  })
);

// Update Show
router.put(
  "/show/:id",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const updatedShowData = req.body;
    const id = req.params.id;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const updatedShow = await updateSeries(id, updatedShowData);
    return res.status(200).json({
      status: "success",
      message: messages.success.update,
      data: updatedShow,
    });
  })
);

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

// Update Episode
router.put(
  "/episode/:id",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const updatedEpisodeData = req.body;
    const id = req.params.id;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const updatedEpisode = await updateEpisode(id, updatedEpisodeData);
    return res.status(200).json({
      status: "success",
      message: messages.success.update,
      data: updatedEpisode,
    });
  })
);

// Update Video
router.put(
  "/video/:id",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const updatedVideoData = req.body;
    const id = req.params.id;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const updatedVideo = await updateVideo(id, updatedVideoData);
    return res.status(200).json({
      status: "success",
      message: messages.success.update,
      data: updatedVideo,
    });
  })
);

// Update Movie
router.put(
  "/movie/:id",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const updatedMovieData = req.body;
    const id = req.params.id;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const updatedMovie = await updateMovie(id, updatedMovieData);
    return res.status(200).json({
      status: "success",
      message: messages.success.update,
      data: updatedMovie,
    });
  })
);

// Update Album
router.put(
  "/album/:id",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const updatedAlbumData = req.body;
    const id = req.params.id;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const updatedAlbum = await updateAlbum(id, updatedAlbumData);
    return res.status(200).json({
      status: "success",
      message: messages.success.update,
      data: updatedAlbum,
    });
  })
);

// Update Song
router.put(
  "/song/:id",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const updatedSongData = req.body;
    const id = req.params.id;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const updatedSong = await updateSong(id, updatedSongData);
    return res.status(200).json({
      status: "success",
      message: messages.success.update,
      data: updatedSong,
    });
  })
);

export default router;
