import { MovieDBWrapper } from "../../../data/utils/MovieDB";
import express from "express";
const router = express.Router();
import { MovieDb } from "moviedb-promise";

// Check server status
router.get("/", (_req, res) => {
  if (MovieDBWrapper.THEMOVIEDB_API_KEY) {
    const moviedb = new MovieDb(String(MovieDBWrapper.THEMOVIEDB_API_KEY));

    res.json({
      status: moviedb ? "VALID_API_KEY" : "INVALID_API_KEY",
    });
  } else {
    res.json({
      status: "INVALID_API_KEY",
    });
  }
});

export default router;
