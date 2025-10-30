import catchAsync from "@/utils/catchAsync";
import express from "express";
import { UsersController } from "../controllers/UsersController";

const router = express.Router();

router.post("/users", catchAsync(UsersController.create));
router.put("/users/:id", catchAsync(UsersController.update));
router.delete("/users/:id", catchAsync(UsersController.delete));

export default router;
