import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { NextFunction, Request, Response } from "express";
import { AuthenticateUserUseCase } from "../../../application/usecases/AuthenticateUserUseCase";
import { CreateUserUseCase } from "../../../application/usecases/CreateUserUseCase";
import { DeleteUserUseCase } from "../../../application/usecases/DeleteUserUseCase";
import { GetAllUsersUseCase } from "../../../application/usecases/GetAllUsersUseCase";
import { UpdateUserUseCase } from "../../../application/usecases/UpdateUserUseCase";
import { UsersRepositoryImpl } from "../../persistence/repositories/UsersRepositoryImpl";

const usersRepo = new UsersRepositoryImpl();

export class UsersController {
  static async login(req: Request, res: Response, next: NextFunction) {
    const { username, password } = req.body;

    const useCase = new AuthenticateUserUseCase(usersRepo);
    const authenticadedUser = await useCase.execute(username, password);

    if (!authenticadedUser)
      return next(new ApiError(401, messages.errors.server.credentials));

    const { token, user } = authenticadedUser;
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
  }

  static async findAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const useCase = new GetAllUsersUseCase(usersRepo);
      const users = await useCase.execute();
      res.status(200).json(users);
    } catch (err) {
      next(err);
    }
  }

  static async authenticate(req: Request, res: Response, next: NextFunction) {
    const { username, password } = req.body;

    if (!username || !password)
      return next(new ApiError(400, messages.errors.validation.invalidData));

    try {
      const useCase = new AuthenticateUserUseCase(usersRepo);
      const user = await useCase.execute(username, password);

      if (!user)
        return next(new ApiError(401, messages.errors.server.credentials));

      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const useCase = new CreateUserUseCase(usersRepo);
      const user = await useCase.execute(req.body);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new UpdateUserUseCase(usersRepo);
      const result = await useCase.execute(id, req.body);

      res.status(200).json({
        status: "success",
        message: messages.success.update,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new DeleteUserUseCase(usersRepo);
      const result = await useCase.execute(id);

      res.status(200).json({
        status: "success",
        message: messages.success.update,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
