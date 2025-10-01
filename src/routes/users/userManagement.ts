import { User } from "@/data/models/Main/User.model";
import { UserManager } from "@/managers/UserManager";
import catchAsync from "@/utils/catchAsync";
import { NextFunction, Request, Response, Router } from "express";

const router = Router();

router.get(
  "/users",
  catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
    const users = await User.findAll({ attributes: { exclude: ["password"] } });
    return res.status(200).json(users);
  })
);

router.post(
  "/users",
  catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const newUser = await UserManager.createUser(req.body);
    return res.status(201).json(newUser);
  })
);

router.put(
  "/users/:id",
  catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const user = await UserManager.updateUser(req.params.id, req.body);
    return res.status(200).json(user);
  })
);

router.delete(
  "/users/:id",
  catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const user = await UserManager.deleteUser(req.params.id);
    return res.status(200).json(user);
  })
);

export default router;
