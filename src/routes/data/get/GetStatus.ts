import express from "express";
import { MovieDBWrapper } from "../../../theMovieDB/MovieDB";
const router = express.Router();

// Check server status
router.get("/", async (_req, res) => {
  if (MovieDBWrapper.THEMOVIEDB_API_TOKEN) {
    const apiKeyStatus = await MovieDBWrapper.getAPIKeyStatus();

    res.json({
      status: apiKeyStatus ? "VALID_API_KEY" : "INVALID_API_KEY",
    });
  } else {
    res.json({
      status: "INVALID_API_KEY",
    });
  }
});

export default router;
