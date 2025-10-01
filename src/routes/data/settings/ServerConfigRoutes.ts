import { messages } from "@/config/messages";
import { Server } from "@/data/models/Main/Server.model";
import { ServerConfigManager } from "@/managers/ServerConfigManager";
import ApiError from "@/utils/ApiError";
import catchAsync from "@/utils/catchAsync";
import { NextFunction, Request, Response, Router } from "express";

const router = Router();

router.get(
  "/server/config",
  catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
    const config = await Server.findByPk(ServerConfigManager.serverConfig.id);
    return res.status(200).json(config);
  })
);

router.put(
  "/server/config",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const config = await Server.findByPk(ServerConfigManager.serverConfig.id);
    if (!config) return next(new ApiError(404, messages.errors.notFound.file));

    await config.update(req.body);
    ServerConfigManager.serverConfig = config;

    // Restart server to apply changes
    await ServerConfigManager.restartServer();
    res
      .status(200)
      .json({ message: "Server config updated and server restarted" });
  })
);

export default router;
