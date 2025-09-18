import express from "express";
import fs from "fs";
import { MovieDBWrapper } from "../../../theMovieDB/MovieDB";
import { FilesManager } from "../../../utils/FilesManager";
const router = express.Router();

// Check server status
router.get("/", async (_req: any, res: any) => {
  const serverID = fs.readFileSync(
    FilesManager.getExternalPath("resources/config/server.id"),
    "utf-8"
  );
  if (MovieDBWrapper.THEMOVIEDB_API_TOKEN) {
    const apiKeyStatus = await MovieDBWrapper.getAPIKeyStatus();

    return res.json({
      id: serverID,
      status: apiKeyStatus ? "VALID_API_KEY" : "INVALID_API_KEY",
    });
  }

  return res.json({
    id: serverID,
    status: "INVALID_API_KEY",
  });
});

export default router;
