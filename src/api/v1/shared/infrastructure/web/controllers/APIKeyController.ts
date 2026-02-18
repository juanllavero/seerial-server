import { tmdbApiClient } from "@/api/v1/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import { MovieDb } from "moviedb-promise";
import propertiesReader from "properties-reader";
import { Body, Controller, Post, Route, Security, Tags } from "tsoa";
import { fileSystemService } from "../../adapters/di/container";
import { ApiResponse } from "../http/APIResponse";

interface APIKeyDTO {
  apiKey: string;
}

interface APIKeyResponse {
  status: "VALID_API_KEY" | "INVALID_API_KEY";
}

@Route("configuration")
@Tags("Configuration")
export class APIKeyController extends Controller {
  /**
   * Configure TMDB API key
   */
  @Post("api-key")
  @Security("adminAuth")
  public async configureApiKey(
    @Body() body: APIKeyDTO
  ): Promise<ApiResponse<APIKeyResponse>> {
    const { apiKey } = body;

    const properties =
      propertiesReader(fileSystemService.propertiesFilePath) || undefined;

    // Save API key in properties file
    properties.set("TMDB_API_KEY", apiKey);
    properties.save(fileSystemService.propertiesFilePath);

    if (!apiKey) {
      return ApiResponse.success(
        { status: "INVALID_API_KEY" },
        messages.success.fetch
      );
    }

    const moviedb = new MovieDb(String(apiKey));
    tmdbApiClient.THEMOVIEDB_API_TOKEN = apiKey;

    return ApiResponse.success(
      {
        status: moviedb ? "VALID_API_KEY" : "INVALID_API_KEY",
      },
      messages.success.fetch
    );
  }
}
