import AuthMiddleware from "@/middleware/authMiddleware";
import * as routes from "@/routes/index";
import cookieParser from "cookie-parser";
import { Express, Router } from "express";

export function addServerRoutes(appServer: Express) {
  const authMiddleware = new AuthMiddleware();
  const apiRouter = Router();

  // Use cookie-parser middleware before your routes
  apiRouter.use(cookieParser());

  // Public routes
  apiRouter.use("/", routes.getStatusRoutes);
  apiRouter.use("/", routes.userManagementPublicRoutes);

  // Custom authentication with temp token
  apiRouter.use("/", routes.getVideoFileRoutes);

  // Management routes (require local access or admin access)
  apiRouter.use(
    "/",
    authMiddleware.requireManagementAccess,
    routes.userManagementRoutes
  );

  // Access restricted to users
  apiRouter.use("/", authMiddleware.requireAccess, routes.getMediaRoutes);
  apiRouter.use("/", authMiddleware.requireAccess, routes.publicPostRoutes);
  apiRouter.use("/", authMiddleware.requireAccess, routes.publicUpdateRoutes);

  // Fast access routes for users
  apiRouter.use(
    "/",
    authMiddleware.requireAccessFast,
    routes.getMediaInfoRoutes
  );
  apiRouter.use("/", authMiddleware.requireAccessFast, routes.getVideoRoutes);
  apiRouter.use("/", authMiddleware.requireAccessFast, routes.getAudioRoutes);
  apiRouter.use("/", authMiddleware.requireAccessFast, routes.getColorsRoutes);
  apiRouter.use("/", authMiddleware.requireAccessFast, routes.getImagesRoutes);

  // Access restricted to admin users
  apiRouter.use("/", authMiddleware.requireAdmin, routes.folderRoutes);
  apiRouter.use("/", authMiddleware.requireAdmin, routes.deleteDataRoutes);
  apiRouter.use("/", authMiddleware.requireAdmin, routes.postDataRoutes);
  apiRouter.use("/", authMiddleware.requireAdmin, routes.updateDataRoutes);
  apiRouter.use("/", authMiddleware.requireAdmin, routes.getHTPCSettings);
  apiRouter.use("/", authMiddleware.requireAdmin, routes.getServerSettings);
  apiRouter.use("/", authMiddleware.requireAdmin, routes.getWebSettings);
  apiRouter.use("/", authMiddleware.requireAdmin, routes.serverConfigRoutes);

  // Add API routes
  appServer.use("/api", apiRouter);
}
