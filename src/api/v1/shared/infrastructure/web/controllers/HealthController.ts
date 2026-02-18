import { ServerModel } from "@/api/v1/servers/infrastructure/persistence/models/ServerModel";
import { messages } from "@/config/messages";
import { Controller, Get, Route, Tags } from "tsoa";
import { fileSystemService, tmdbApiClient } from "../../adapters/di/container";
import { ApiResponse } from "../http/APIResponse";

type HealthStatus = "ok" | "degraded" | "down";

interface HealthResponse {
  status: HealthStatus;
  checks: {
    filesystem: HealthStatus;
    database: HealthStatus;
    ffmpeg: HealthStatus;
    tmdb: HealthStatus;
  };
  uptime: number;
  timestamp: number;
  version: string;
}

@Route("health")
@Tags("Health")
export class HealthController extends Controller {
  /**
   *  Check application health status and dependencies
   * @returns Health status of the application
   */
  @Get()
  public async health(): Promise<ApiResponse<HealthResponse>> {
    const checks = {
      filesystem: await this.checkFilesystem(),
      database: await this.checkDatabase(),
      ffmpeg: await this.checkFFmpeg(),
      tmdb: await this.checkTMDB(),
    };

    const overall = this.calculateOverallStatus(checks);

    return ApiResponse.success(
      {
        status: overall,
        checks,
        uptime: process.uptime(),
        timestamp: Date.now(),
        version: process.env.VERSION || "unknown",
      },
      messages.success.fetch
    );
  }

  private async checkFilesystem(): Promise<HealthStatus> {
    try {
      const path = fileSystemService.getExternalPath("resources");
      fileSystemService.isFolder(path);
      return "ok";
    } catch {
      return "down";
    }
  }

  private async checkDatabase(): Promise<HealthStatus> {
    try {
      await ServerModel.find({ take: 1 });
      return "ok";
    } catch {
      return "down";
    }
  }

  private async checkFFmpeg(): Promise<HealthStatus> {
    try {
      await new Promise((resolve, reject) => {
        const { exec } = require("child_process");
        exec("ffmpeg -version", (err: any) => (err ? reject() : resolve(true)));
      });
      return "ok";
    } catch {
      return "degraded"; // Not critical if FFmpeg is missing, only used for conversion and media info extraction
    }
  }

  private async checkTMDB(): Promise<HealthStatus> {
    try {
      if (!tmdbApiClient.THEMOVIEDB_API_TOKEN) return "degraded";
      const ok = await tmdbApiClient.getAPIKeyStatus();
      return ok ? "ok" : "degraded";
    } catch {
      return "degraded";
    }
  }

  private calculateOverallStatus(
    checks: Record<string, HealthStatus>
  ): HealthStatus {
    if (Object.values(checks).includes("down")) return "down";
    if (Object.values(checks).includes("degraded")) return "degraded";
    return "ok";
  }
}
