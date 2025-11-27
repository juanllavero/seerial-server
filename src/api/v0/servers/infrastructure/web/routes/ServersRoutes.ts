import {
  tmdbApiClient,
  useCases,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
import { User } from "@/api/v0/users/domain/User";
import { ServerConfigManager } from "@/managers/ServerConfigManager";
import catchAsync from "@/utils/catchAsync";
import express from "express";
import { ServersController } from "../controllers/ServersController";

const router = express.Router();

router.put("/server/:id", catchAsync(ServersController.update));

// Check server status
router.get("/", async (_req: any, res: any) => {
  const getUsers = useCases.getAllUsers();
  const users: User[] = await getUsers.execute();
  const serverId = ServerConfigManager.serverConfig.id;
  const serverName = ServerConfigManager.serverConfig.name;

  let apiKeyStatus: string = "INVALID_API_KEY";
  if (tmdbApiClient.THEMOVIEDB_API_TOKEN) {
    const status = await tmdbApiClient.getAPIKeyStatus();

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
