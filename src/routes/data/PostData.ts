import express from "express";
import { MovieDb } from "moviedb-promise";
import path from "path";
import propertiesReader from "properties-reader";
import { Downloader } from "../../downloaders/Downloader";
import { FileSearch } from "../../fileSearch/fileSearch";
import {
  updateMovieMetadata,
  updateShowMetadata,
} from "../../fileSearch/updateMetadata";
import { wsManager } from "../../index";
import { MovieDBWrapper } from "../../theMovieDB/MovieDB";
import { FilesManager } from "../../utils/FilesManager";
import { Utils } from "../../utils/Utils";
const router = express.Router();

router.post("/api-key", (req, res) => {
  const { apiKey } = req.body;

  const properties =
    propertiesReader(FilesManager.propertiesFilePath) || undefined;

  // Save API key in properties file
  properties.set("TMDB_API_KEY", apiKey);
  properties.save(FilesManager.propertiesFilePath);

  if (apiKey) {
    const moviedb = new MovieDb(String(apiKey));

    MovieDBWrapper.THEMOVIEDB_API_KEY = apiKey;

    res.json({
      status: moviedb ? "VALID_API_KEY" : "INVALID_API_KEY",
    });
  } else {
    res.json({
      status: "INVALID_API_KEY",
    });
  }
});

// Add library
router.post("/addLibrary", async (req: any, res: any) => {
  const libraryData = req.body;

  const library = await FileSearch.scanFiles(libraryData, wsManager, true);

  return res.status(200).json(library);
});

// Upload image
router.post(
  "/uploadImage",
  FilesManager.upload.single("image"),
  (req: any, res: any) => {
    console.log("Request fields:", req.body);
    const file = req.file;
    const destPath = req.body.destPath;

    console.log({ file, destPath });

    if (!file) {
      return res.status(400).send("No file received");
    }

    if (!destPath) {
      return res.status(400).send("Destination path not specified");
    }

    // Success response
    res
      .status(200)
      .send(
        `Image uploaded successfully to ${path.join(
          destPath,
          file.originalname
        )}`
      );
  }
);

// Download image
router.post("/downloadImage", async (req: any, res: any) => {
  const { url, downloadFolder, fileName } = req.body;

  if (!url || !downloadFolder || !fileName) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  if (!Utils.isValidURL(url)) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  try {
    await Utils.downloadImage(
      url,
      path.join(FilesManager.resourcesPath, downloadFolder, fileName)
    );
  } catch (error) {
    return res.status(400).json({ error: "Error downloading image" });
  }

  res.json({ message: "DOWNLOAD_FINISHED" });
});

// Download video
router.post("/downloadVideo", async (req: any, res: any) => {
  const { url, downloadFolder, fileName } = req.body;

  if (!url || !downloadFolder || !fileName) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  await Downloader.downloadVideo(url, downloadFolder, fileName, wsManager);

  res.json({ message: "DOWNLOAD_FINISHED" });
});

// Download music
router.post("/downloadMusic", (req: any, res: any) => {
  const { url, downloadFolder, fileName } = req.body;

  if (!url || !downloadFolder || !fileName) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  Downloader.downloadAudio(url, downloadFolder, fileName, wsManager);

  res.json({ message: "DOWNLOAD_FINISHED" });
});

// Update TheMovieDB id for show
router.post("/updateShowId", (req: any, res: any) => {
  const { libraryId, showId, themdbId } = req.body;

  if (!showId || !themdbId || !libraryId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  updateShowMetadata(libraryId, showId, themdbId, wsManager);
});

// Update TheMovieDB id for movie
router.post("/updateMovieId", (req: any, res: any) => {
  const { libraryId, movieId, themdbId } = req.body;

  if (!movieId || !themdbId || !libraryId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  updateMovieMetadata(libraryId, movieId, themdbId, wsManager);
});

// Update episode group for show
router.post("/updateEpisodeGroup", (req: any, res: any) => {
  const { libraryId, showId, themdbId, episodeGroupId } = req.body;

  if (!showId || !themdbId || !episodeGroupId || !libraryId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  updateShowMetadata(libraryId, showId, themdbId, wsManager, episodeGroupId);
});

export default router;
