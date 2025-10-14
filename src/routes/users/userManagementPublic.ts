import { messages } from "@/config/messages";
import { getUsers } from "@/db/get/getData";
import { UserManager } from "@/managers/UserManager";
import ApiError from "@/utils/ApiError";
import catchAsync from "@/utils/catchAsync";
import { NextFunction, Request, Response, Router } from "express";

const router = Router();

// Login
router.post(
  "/users/login",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body;
    const response = await UserManager.authenticateUser(
      username,
      password || null
    );

    if (!response)
      return next(new ApiError(401, messages.errors.server.credentials));

    const { token, user } = response;
    if (!token)
      return next(new ApiError(401, messages.errors.server.credentials));

    // Set JWT in HttpOnly cookie
    res.cookie("jwt", token, {
      httpOnly: true, // Protects from XSS
      path: "/",
      secure: req.protocol === "https",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json(user);
  })
);

// Get non-hidden users
router.get(
  "/users/public",
  catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
    const users = await getUsers();
    return res.status(200).json(users);
  })
);

export default router;
