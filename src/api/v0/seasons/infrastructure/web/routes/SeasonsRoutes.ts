import catchAsync from "@/utils/catchAsync";
import express from "express";
import { SeasonsController } from "../controllers/SeasonsController";

const router = express.Router();

router.put("/season/:id", catchAsync(SeasonsController.update));
router.delete("/season/:id", catchAsync(SeasonsController.delete));

export default router;
