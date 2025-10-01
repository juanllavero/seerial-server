import AuthMiddleware from "@/middleware/authMiddleware";
import * as routes from "@/routes/index";
import cookieParser from "cookie-parser";
import { Express } from "express";

export function addServerRoutes(appServer: Express) {
  const authMiddleware = new AuthMiddleware();

  // Use cookie-parser middleware before your routes
  appServer.use(cookieParser());

  // Public routes
  appServer.use("/", routes.getStatusRoutes);
  appServer.use("/", routes.userManagementPublicRoutes);

  // Management routes (require local access or admin access)
  appServer.use(
    "/",
    authMiddleware.requireManagementAccess,
    routes.userManagementRoutes
  );

  // Custom authentication with temp token
  appServer.use("/", routes.getVideoFileRoutes);

  // Access restricted to users
  appServer.use("/", authMiddleware.requireAccess, routes.getMediaRoutes);
  appServer.use("/", authMiddleware.requireAccess, routes.publicPostRoutes);
  appServer.use("/", authMiddleware.requireAccess, routes.publicUpdateRoutes);

  // Fast access routes for users
  appServer.use(
    "/",
    authMiddleware.requireAccessFast,
    routes.getMediaInfoRoutes
  );
  appServer.use("/", authMiddleware.requireAccessFast, routes.getVideoRoutes);
  appServer.use("/", authMiddleware.requireAccessFast, routes.getAudioRoutes);
  appServer.use("/", authMiddleware.requireAccessFast, routes.getColorsRoutes);
  appServer.use("/", authMiddleware.requireAccessFast, routes.getImagesRoutes);

  // Access restricted to admin users
  appServer.use("/", authMiddleware.requireAdmin, routes.folderRoutes);
  appServer.use("/", authMiddleware.requireAdmin, routes.deleteDataRoutes);
  appServer.use("/", authMiddleware.requireAdmin, routes.postDataRoutes);
  appServer.use("/", authMiddleware.requireAdmin, routes.updateDataRoutes);
  appServer.use("/", authMiddleware.requireAdmin, routes.getHTPCSettings);
  appServer.use("/", authMiddleware.requireAdmin, routes.getServerSettings);
  appServer.use("/", authMiddleware.requireAdmin, routes.getWebSettings);
  appServer.use("/", authMiddleware.requireAdmin, routes.serverConfigRoutes);
}
