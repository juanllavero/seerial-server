import catchAsync from "@/utils/catchAsync";
import express from "express";
import { ServersController } from "../controllers/ServersController";

const router = express.Router();

router.get("/server", catchAsync(ServersController.getServerConfig));
router.put("/server/config", catchAsync(ServersController.update));

export default router;
