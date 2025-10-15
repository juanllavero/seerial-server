import userManagementPublicRoutes from "@/api/v0/users/users.routes.public";
import getStatusRoutes from "@/routes/data/get/getStatus";
import { Router } from "express";

const publicRoutes = Router();

publicRoutes.use("/", userManagementPublicRoutes);
publicRoutes.use("/", getStatusRoutes);

export default publicRoutes;
