import catchAsync from "@/utils/catchAsync";
import express from "express";
import { UsersController } from "../controllers/UsersController";

const router = express.Router();

router.put("/users/public", catchAsync(UsersController.findAll));
router.delete("/users/login", catchAsync(UsersController.login));

export default router;
