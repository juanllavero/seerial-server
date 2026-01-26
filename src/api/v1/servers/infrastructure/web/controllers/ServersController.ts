import {
  fileSystemService,
  tmdbApiClient,
  useCases,
} from "@/api/v1/shared/infrastructure/adapters/di/container";
import { User } from "@/api/v1/users/domain/User";
import { messages } from "@/config/messages";
import {
  Body,
  Controller,
  Get,
  Patch,
  Path,
  Put,
  Route,
  Security,
  Tags,
} from "tsoa";
import {
  ServerConfigDTO,
  ServerConfigResponse,
  ServerResponse,
  UpdateServerConfigDTO,
  UpdateServerDTO,
} from "../../../application/dtos/ServerDTOs";
import { ServerConfigService } from "../../services/ServerConfigService";

@Route("servers")
@Tags("Servers")
export class ServersController extends Controller {
  /**
   * Get server status
   */
  @Get()
  public async getServerStatus(): Promise<any> {
    const getUsers = useCases.getAllUsers();
    const users: User[] = await getUsers.execute();
    const serverId = ServerConfigService.serverConfig.id;
    const serverName = ServerConfigService.serverConfig.name;

    let apiKeyStatus: string = "INVALID_API_KEY";
    if (tmdbApiClient.THEMOVIEDB_API_TOKEN) {
      const status = await tmdbApiClient.getAPIKeyStatus();

      if (status) {
        apiKeyStatus = "VALID_API_KEY";
      }
    }

    return {
      id: serverId,
      name: serverName,
      status: apiKeyStatus,
      users,
    };
  }

  /**
   * Update server configuration
   */
  @Put("{id}")
  @Security("adminAuth")
  public async update(
    @Path() id: string,
    @Body() body: UpdateServerDTO
  ): Promise<ServerResponse> {
    const result = await useCases.updateServer().execute(id, body);

    return {
      status: "success",
      message: messages.success.update,
      data: result,
    };
  }

  /**
   * Get a specific server config setting
   */
  @Get("config/{key}")
  @Security("adminAuth")
  public async getServerConfigKey(
    @Path() key: string
  ): Promise<ServerConfigResponse> {
    const SERVER_CONFIG_FILE = fileSystemService.getExternalPath(
      "resources/config/serverConfig.json"
    );

    const defaultServerConfig = {
      autoScan: false,
      autoScanPeriod: "never",
      generateChapters: "never",
      autoSelectTracks: true,
      preferAudioLan: "es-ES",
      preferSubsLan: "es-ES",
      subsMode: "autoSubs",
      tempTranscodeFolder: "",
      transcodeBuffer: 60,
      transcodePreset: "veryfast",
      maxTranscodeProcesses: 4,
      automaticUpdates: false,
    };

    fileSystemService.createJSONFile(SERVER_CONFIG_FILE, defaultServerConfig);
    const configData = JSON.parse(
      fileSystemService.readFileSync(SERVER_CONFIG_FILE, "utf8")
    );

    const value = configData[key] !== undefined ? configData[key] : null;
    return { key, value };
  }

  /**
   * Get all server config settings
   */
  @Get("config")
  @Security("adminAuth")
  public async getServerConfig(): Promise<ServerConfigDTO> {
    const SERVER_CONFIG_FILE = fileSystemService.getExternalPath(
      "resources/config/serverConfig.json"
    );

    const defaultServerConfig = {
      autoScan: false,
      autoScanPeriod: "never",
      generateChapters: "never",
      autoSelectTracks: true,
      preferAudioLan: "es-ES",
      preferSubsLan: "es-ES",
      subsMode: "autoSubs",
      tempTranscodeFolder: "",
      transcodeBuffer: 60,
      transcodePreset: "veryfast",
      maxTranscodeProcesses: 4,
      automaticUpdates: false,
    };

    fileSystemService.createJSONFile(SERVER_CONFIG_FILE, defaultServerConfig);
    const configData = JSON.parse(
      fileSystemService.readFileSync(SERVER_CONFIG_FILE, "utf8")
    );
    return configData;
  }

  /**
   * Update server config settings
   */
  @Patch("config")
  @Security("adminAuth")
  public async updateServerConfig(
    @Body() body: UpdateServerConfigDTO
  ): Promise<ServerResponse> {
    const SERVER_CONFIG_FILE = fileSystemService.getExternalPath(
      "resources/config/serverConfig.json"
    );

    const defaultServerConfig = {
      autoScan: false,
      autoScanPeriod: "never",
      generateChapters: "never",
      autoSelectTracks: true,
      preferAudioLan: "es-ES",
      preferSubsLan: "es-ES",
      subsMode: "autoSubs",
      tempTranscodeFolder: "",
      transcodeBuffer: 60,
      transcodePreset: "veryfast",
      maxTranscodeProcesses: 4,
      automaticUpdates: false,
    };

    fileSystemService.createJSONFile(SERVER_CONFIG_FILE, defaultServerConfig);
    const updates = body;
    let configData = JSON.parse(
      fileSystemService.readFileSync(SERVER_CONFIG_FILE, "utf8")
    );

    configData = { ...configData, ...updates };

    fileSystemService.writeFile(
      SERVER_CONFIG_FILE,
      JSON.stringify(configData, null, 2)
    );
    return {
      status: "success",
      message: "Configuration updated",
      data: configData,
    };
  }
}
