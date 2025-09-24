import express from "express";
import {
  updateAlbum,
  updateCollection,
  updateEpisode,
  updateLibrary,
  updateMovie,
  updateSeason,
  updateSeries,
  updateVideo,
} from "../../../db/update/updateData";

const router = express.Router();

// Update Library
router.put("/library/:id", async (req: any, res: any) => {
  const updatedLibrary = req.body;
  const id = req.params.id;

  if (!id || typeof id !== "string" || id === "") {
    return res.status(400).json({ message: "No ID provided or invalid ID." });
  }

  try {
    await updateLibrary(id, updatedLibrary);
    res.status(200).json({ message: "Library updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update library" });
  }
});

// Update Collection
router.put("/collection/:id", async (req: any, res: any) => {
  const updatedCollection = req.body;
  const id = req.params.id;

  if (!id || typeof id !== "string" || id === "") {
    return res.status(400).json({ message: "No ID provided or invalid ID." });
  }

  try {
    await updateCollection(id, updatedCollection);
    res.status(200).json({ message: "Collection updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update collection" });
  }
});

// Update Show
router.put("/show/:id", async (req: any, res: any) => {
  const updatedShow = req.body;
  const id = req.params.id;

  if (!id || typeof id !== "string" || id === "") {
    return res.status(400).json({ message: "No ID provided or invalid ID." });
  }

  try {
    await updateSeries(id, updatedShow);
    res.status(200).json({ message: "Show updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update show" });
  }
});

// Update Season
router.put("/season/:id", async (req: any, res: any) => {
  const updatedSeason = req.body;
  const id = req.params.id;

  if (!id || typeof id !== "string" || id === "") {
    return res.status(400).json({ message: "No ID provided or invalid ID." });
  }

  try {
    await updateSeason(id, updatedSeason);
    res.status(200).json({ message: "Season updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update season" });
  }
});

// Update Episode
router.put("/episode/:id", async (req: any, res: any) => {
  const updatedEpisode = req.body;
  const id = req.params.id;

  if (!id || typeof id !== "string" || id === "") {
    return res.status(400).json({ message: "No ID provided or invalid ID." });
  }

  try {
    await updateEpisode(id, updatedEpisode);
    res.status(200).json({ message: "Episode updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update episode" });
  }
});

// Update Video
router.put("/video:id", async (req: any, res: any) => {
  const updatedVideo = req.body;
  const id = req.params.id;

  if (!id || typeof id !== "string" || id === "") {
    return res.status(400).json({ message: "No ID provided or invalid ID." });
  }

  try {
    await updateVideo(id, updatedVideo);
    res.status(200).json({ message: "Video updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update video" });
  }
});

// Update Movie
router.put("/movie/:id", async (req: any, res: any) => {
  const updatedMovie = req.body;
  const id = req.params.id;

  if (!id || typeof id !== "string" || id === "") {
    return res.status(400).json({ message: "No ID provided or invalid ID." });
  }

  try {
    await updateMovie(id, updatedMovie);
    res.status(200).json({ message: "Movie updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update movie" });
  }
});

// Update Album
router.put("/album/:id", async (req: any, res: any) => {
  const updatedAlbum = req.body;
  const id = req.params.id;

  if (!id || typeof id !== "string" || id === "") {
    return res.status(400).json({ message: "No ID provided or invalid ID." });
  }

  try {
    await updateAlbum(id, updatedAlbum);
    res.status(200).json({ message: "Album updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update album" });
  }
});

// Update Song
router.put("/song/:id", async (req: any, res: any) => {
  const updatedSong = req.body;
  const id = req.params.id;

  if (!id || typeof id !== "string" || id === "") {
    return res.status(400).json({ message: "No ID provided or invalid ID." });
  }

  try {
    await updateVideo(id, updatedSong);
    res.status(200).json({ message: "Song updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update song" });
  }
});

export default router;
