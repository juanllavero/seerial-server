import statusRoutes from "@/api/v0/servers/infrastructure/web/routes/ServerStatusRoutes";
import userManagementPublicRoutes from "@/api/v0/users/infrastructure/web/routes/UsersPublicRoutes";
import { Router } from "express";

const publicRoutes = Router();

publicRoutes.use("/", userManagementPublicRoutes);
publicRoutes.use("/", statusRoutes);

export default publicRoutes;
