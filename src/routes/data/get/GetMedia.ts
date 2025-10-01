import { messages } from "@/config/messages";
import {
  getAlbums,
  getContinueWatchingVideos,
  getEpisodes,
  getMovies,
  getMoviesInMyList,
  getSeasons,
  getSeries,
  getSeriesInMyList,
} from "@/db/get/getData";
import { ExternalSearchManager } from "@/managers/ExternalSearchManager";
import { LibraryManager } from "@/managers/LibraryManager";
import { MediaDetailsManager } from "@/managers/MediaDetailsManager";
import ApiError from "@/utils/ApiError";
import catchAsync from "@/utils/catchAsync";
import express, { NextFunction, Request, Response } from "express";

const router = express.Router();

// Helper to get authenticated user ID
const getUserId = (req: Request) => {
  const userId = (req as any).user?.id;
  if (!userId) throw new ApiError(401, "User authentication is required.");
  return userId;
};

// #region LIBRARY AND LISTS
router.get(
  "/library",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.query;
    if (typeof id !== "string")
      return next(new ApiError(400, "Query parameter 'id' is required."));
    const library = await LibraryManager.getLibraryById(id);
    res.status(200).json(library);
  })
);

router.get(
  "/libraries",
  catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
    const libraries = await LibraryManager.getAllLibraries();
    res.status(200).json(libraries);
  })
);

router.get(
  "/library-content",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { libraryId, type } = req.query;
    const userId = getUserId(req);
    if (typeof libraryId !== "string" || typeof type !== "string") {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }
    const content = await LibraryManager.getLibraryContent(
      libraryId,
      type,
      userId
    );
    res.status(200).json(content);
  })
);

router.get(
  "/library-content-flat",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { libraryId, type } = req.query;
    const userId = getUserId(req);
    if (typeof libraryId !== "string" || typeof type !== "string") {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }
    const content = await LibraryManager.getLibraryContent(
      libraryId,
      type,
      userId,
      true
    );
    res.status(200).json(content);
  })
);

router.get(
  "/series",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { libraryId } = req.query;

    if (!libraryId || libraryId === "") {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }

    return res.status(200).json(await getSeries(libraryId as string));
  })
);

router.get(
  "/movies",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { libraryId } = req.query;

    if (!libraryId || libraryId === "") {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }

    return res.json(await getMovies(libraryId as string));
  })
);

router.get(
  "/seasons",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { seriesId } = req.query;

    if (!seriesId || seriesId === "") {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }

    return res.json(await getSeasons(seriesId as string));
  })
);

router.get(
  "/episodes",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { seasonId } = req.query;

    if (!seasonId || seasonId === "") {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }

    return res.json(await getEpisodes(seasonId as string));
  })
);

router.get(
  "/albums",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { libraryId } = req.query;

    if (!libraryId || libraryId === "") {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }

    return res.json(await getAlbums(libraryId as string));
  })
);

router.get(
  "/myListSeries",
  catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const series = await getSeriesInMyList(getUserId(req));
    res.status(200).json(series);
  })
);

router.get(
  "/myListMovies",
  catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const movies = await getMoviesInMyList(getUserId(req));
    res.status(200).json(movies);
  })
);

router.get(
  "/continueWatching",
  catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const videos = await getContinueWatchingVideos(getUserId(req));
    res.status(200).json(videos);
  })
);
// #endregion

// #region DETAILS
router.get(
  "/details/:type",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { type } = req.params;
    const { id } = req.query;
    if (typeof id !== "string")
      return next(new ApiError(400, "Query parameter 'id' is required."));
    const details = await MediaDetailsManager.getDetails(type, id);
    res.status(200).json(details);
  })
);
// #endregion

// #region BACKGROUND MEDIA
router.get(
  "/:itemType(movie|series|season)/:mediaType(video|music)",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { itemType, mediaType } = req.params as {
      itemType: "movie" | "series" | "season";
      mediaType: "video" | "music";
    };
    const { id } = req.query;
    if (typeof id !== "string")
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    const url = await MediaDetailsManager.findMediaBackground(
      mediaType,
      itemType,
      id
    );
    res.status(200).json(url);
  })
);
// #endregion

// #region LIBRARY ACTIONS
router.get(
  "/library/search",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { libraryId } = req.query;
    if (typeof libraryId !== "string")
      return next(
        new ApiError(400, "Query parameter 'libraryId' is required.")
      );
    const result = await LibraryManager.startLibraryScan(libraryId);
    res.status(202).json(result);
  })
);
// #endregion

// #region EXTERNAL SEARCH ROUTES
router.get(
  "/movies/search",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, year } = req.query;
    if (typeof name !== "string") {
      return next(new ApiError(400, "Query parameter 'name' is required."));
    }
    const results = await ExternalSearchManager.searchMovies(
      name,
      year as string | undefined
    );
    res.status(200).json(results);
  })
);

router.get(
  "/shows/search",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, year } = req.query;
    if (typeof name !== "string") {
      return next(new ApiError(400, "Query parameter 'name' is required."));
    }
    const results = await ExternalSearchManager.searchTvShows(
      name,
      year as string | undefined
    );
    res.status(200).json(results);
  })
);

router.get(
  "/episodeGroups/search",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.query;
    if (typeof id !== "string") {
      return next(new ApiError(400, "Query parameter 'id' is required."));
    }
    const results = await ExternalSearchManager.searchEpisodeGroups(id);
    res.status(200).json(results);
  })
);

router.get(
  "/imdbScore",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.query;
    if (typeof id !== "string") {
      return next(new ApiError(400, "Query parameter 'id' is required."));
    }
    const score = await ExternalSearchManager.getImdbScore(id);
    res.status(200).json(score);
  })
);

router.get(
  "/media/search",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { query } = req.query;
    if (typeof query !== "string") {
      return next(new ApiError(400, "Query parameter 'query' is required."));
    }
    const results = await ExternalSearchManager.searchDownloadableMedia(query);
    res.status(200).json(results);
  })
);
// #endregion

// #region LYRICS AND MUSIC EXTRAS
router.get(
  "/lyrics",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.query;
    if (typeof id !== "string") {
      return next(new ApiError(400, "Query parameter 'id' is required."));
    }
    const lyrics = await MediaDetailsManager.findLyricsForSong(id);
    res.status(200).json(lyrics);
  })
);

router.get(
  "/musicExtras/:collectionId",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { collectionId } = req.params;
    const extras = await MediaDetailsManager.findMusicExtras(collectionId);
    res.status(200).json(extras);
  })
);
// #endregion

export default router;
