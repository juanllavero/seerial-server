import catchAsync from "@/utils/catchAsync";
import { NextFunction, Request, Response, Router } from "express";
import { MovieDb } from "moviedb-promise";
import propertiesReader from "properties-reader";
import { fileSystemService, tmdbApiClient } from "../../adapters/di/container";

const router = Router();

router.post(
  "/configuration/api-key",
  catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { apiKey } = req.body;

    const properties =
      propertiesReader(fileSystemService.propertiesFilePath) || undefined;

    // Save API key in properties file
    properties.set("TMDB_API_KEY", apiKey);
    properties.save(fileSystemService.propertiesFilePath);

    if (!apiKey) {
      return res.status(400).json({
        status: "INVALID_API_KEY",
      });
    }

    const moviedb = new MovieDb(String(apiKey));

    tmdbApiClient.THEMOVIEDB_API_TOKEN = apiKey;

    return res.status(200).json({
      status: moviedb ? "VALID_API_KEY" : "INVALID_API_KEY",
    });
  })
);

export default router;
