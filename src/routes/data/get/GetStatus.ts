import { User } from "@/api/v0/users/users.model";
import { getUsers } from "@/api/v0/users/users.service";
import { ServerConfigManager } from "@/managers/ServerConfigManager";
import { MovieDBWrapper } from "@/theMovieDB/MovieDB";
import express from "express";
const router = express.Router();

// Check server status
router.get("/", async (_req: any, res: any) => {
  const users: User[] = await getUsers();
  const serverId = ServerConfigManager.serverConfig.id;
  const serverName = ServerConfigManager.serverConfig.name;

  let apiKeyStatus: string = "INVALID_API_KEY";
  if (MovieDBWrapper.THEMOVIEDB_API_TOKEN) {
    const status = await MovieDBWrapper.getAPIKeyStatus();

    if (status) {
      apiKeyStatus = "VALID_API_KEY";
    }
  }

  return res.status(200).json({
    id: serverId,
    name: serverName,
    status: apiKeyStatus,
    users,
  });
});

export default router;
