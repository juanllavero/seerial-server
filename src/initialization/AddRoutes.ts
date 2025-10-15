import adminRoutes from "@/api/v0/admin.routes";
import fastRoutes from "@/api/v0/fast.routes";
import publicRoutes from "@/api/v0/public.routes";
import userRoutes from "@/api/v0/user.routes";
import userManagementRoutes from "@/api/v0/users/users.routes";
import AuthMiddleware from "@/middleware/auth.middleware";
import * as routes from "@/routes/index";
import cookieParser from "cookie-parser";
import { Router } from "express";

const authMiddleware = new AuthMiddleware();
const apiRouter = Router();

// Use cookie-parser middleware before your routes
apiRouter.use(cookieParser());

// Public routes
apiRouter.use("/", publicRoutes);

// Custom authentication with temp token
apiRouter.use("/", routes.getVideoFileRoutes);

// Management routes (require local access or admin access)
apiRouter.use(
  "/",
  authMiddleware.requireManagementAccess,
  userManagementRoutes
);

// Access restricted to users
apiRouter.use("/", authMiddleware.requireAccess, userRoutes);

// Fast access routes for users
apiRouter.use("/", authMiddleware.requireAccessFast, fastRoutes);

// Access restricted to admin users
apiRouter.use("/", authMiddleware.requireAdmin, adminRoutes);

export default apiRouter;
