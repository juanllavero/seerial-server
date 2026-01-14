import { useCases } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { Body, Controller, Path, Put, Route, Security, Tags } from "tsoa";
import {
  ServerResponse,
  UpdateServerDTO,
} from "../../../application/dtos/ServerDTOs";

@Route("servers")
@Tags("Servers")
export class ServersController extends Controller {
  /**
   * Update server configuration
   */
  @Put("server/{id}")
  @Security("cookieAuth")
  public async update(
    @Path() id: string,
    @Body() body: UpdateServerDTO
  ): Promise<ServerResponse> {
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

    const result = await useCases.updateServer().execute(id, body);

    return {
      status: "success",
      message: messages.success.update,
      data: result,
    };
  }
}
