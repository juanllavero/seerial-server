import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { NextFunction, Request, Response } from "express";
import { CreateServerUseCase } from "../../../application/usecases/CreateServerUseCase";
import { GetServerUseCase } from "../../../application/usecases/GetServerUseCase";
import { UpdateServerUseCase } from "../../../application/usecases/UpdateServerUseCase";
import { ServersRepositoryImpl } from "../../persistence/repositories/ServersRepositoryImpl";

const serversRepo = new ServersRepositoryImpl();

export class ServersController {
  static async getServerConfig(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new GetServerUseCase(serversRepo);
      const result = await useCase.execute();

      res.status(200).json({
        status: "success",
        message: messages.success.update,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new CreateServerUseCase(serversRepo);
      const result = await useCase.execute(req.body);

      res.status(200).json({
        status: "success",
        message: messages.success.update,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new UpdateServerUseCase(serversRepo);
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
}
