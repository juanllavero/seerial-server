import catchAsync from "@/utils/catchAsync";
import express from "express";
import { ServersController } from "../controllers/ServersController";

const router = express.Router();

router.put("/server/:id", catchAsync(ServersController.update));

export default router;
