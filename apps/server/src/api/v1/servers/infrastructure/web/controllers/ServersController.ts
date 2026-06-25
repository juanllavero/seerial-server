import type { User } from '@seerial/domain';
import { Body, Controller, Get, Patch, Path, Route, Security, Tags } from 'tsoa';
import {
  fileSystemService,
  tmdbApiClient,
  useCases,
} from '@/api/v1/shared/infrastructure/adapters/di/container';
import { ApiResponse } from '@/api/v1/shared/infrastructure/web/http/APIResponse';
import { messages } from '@/config/messages';
import type {
  ServerConfigDTO,
  ServerConfigResponse,
  ServerStatusResponse,
  ServerUserDTO,
  UpdateServerConfigDTO,
  UpdateServerDTO,
} from '../../../application/dtos/ServerDTOs';
import type { Server } from '../../../domain/Server';
import { ServerConfigService } from '../../services/ServerConfigService';

@Route('servers')
@Tags('Servers')
export class ServersController extends Controller {
  /**
   * Get server status
   */
  @Get()
  @Security('cookieAuth')
  public async getServerStatus(): Promise<ApiResponse<ServerStatusResponse>> {
    const getUsers = useCases.getAllUsers();
    const allUsers: User[] = await getUsers.execute();
    const users: ServerUserDTO[] = allUsers.map((u) => ({
      id: u.id,
      username: u.username,
      avatar: u.avatar,
    }));
    const serverId = ServerConfigService.serverConfig.id;
    const serverName = ServerConfigService.serverConfig.name;

    let apiKeyStatus: string = 'INVALID_API_KEY';
    if (tmdbApiClient.THEMOVIEDB_API_TOKEN) {
      const status = await tmdbApiClient.getAPIKeyStatus();

      if (status) {
        apiKeyStatus = 'VALID_API_KEY';
      }
    }

    return ApiResponse.success(
      {
        id: serverId,
        name: serverName,
        status: apiKeyStatus,
        users,
      },
      messages.success.fetch,
    );
  }

  /**
   * Update server configuration
   */
  @Patch('{id}')
  @Security('adminAuth')
  public async update(
    @Path() id: string,
    @Body() body: UpdateServerDTO,
  ): Promise<ApiResponse<Server>> {
    const result = await useCases.updateServer().execute(id, body);
    return ApiResponse.success(result, messages.success.update);
  }

  /**
   * Get a specific server config setting
   */
  @Get('config/{key}')
  @Security('adminAuth')
  public async getServerConfigKey(@Path() key: string): Promise<ApiResponse<ServerConfigResponse>> {
    const SERVER_CONFIG_FILE = fileSystemService.getExternalPath(
      'resources/config/serverConfig.json',
    );

    const defaultServerConfig = {
      autoScan: false,
      autoScanPeriod: 'never',
      generateChapters: 'never',
      autoSelectTracks: true,
      preferAudioLan: 'es-ES',
      preferSubsLan: 'es-ES',
      subsMode: 'autoSubs',
      tempTranscodeFolder: '',
      transcodeBuffer: 60,
      transcodePreset: 'veryfast',
      maxTranscodeProcesses: 4,
      automaticUpdates: false,
    };

    fileSystemService.createJSONFile(SERVER_CONFIG_FILE, defaultServerConfig);
    const configData = JSON.parse(
      fileSystemService.readFileSync(SERVER_CONFIG_FILE, 'utf8'),
    ) as Record<string, unknown>;

    // Restrict key lookup to known settings while keeping backward-compatible null responses.
    const allowedKeys = Object.keys(defaultServerConfig) as string[];
    const isAllowedKey = allowedKeys.includes(key);
    const value = isAllowedKey && Object.hasOwn(configData, key) ? configData[key] : null;
    return ApiResponse.success({ key, value }, messages.success.fetch);
  }

  /**
   * Get all server config settings
   */
  @Get('config')
  @Security('adminAuth')
  public async getServerConfig(): Promise<ApiResponse<ServerConfigDTO>> {
    const SERVER_CONFIG_FILE = fileSystemService.getExternalPath(
      'resources/config/serverConfig.json',
    );

    const defaultServerConfig = {
      autoScan: false,
      autoScanPeriod: 'never',
      generateChapters: 'never',
      autoSelectTracks: true,
      preferAudioLan: 'es-ES',
      preferSubsLan: 'es-ES',
      subsMode: 'autoSubs',
      tempTranscodeFolder: '',
      transcodeBuffer: 60,
      transcodePreset: 'veryfast',
      maxTranscodeProcesses: 4,
      automaticUpdates: false,
    };

    fileSystemService.createJSONFile(SERVER_CONFIG_FILE, defaultServerConfig);
    const configData = JSON.parse(fileSystemService.readFileSync(SERVER_CONFIG_FILE, 'utf8'));
    return ApiResponse.success(configData, messages.success.fetch);
  }

  /**
   * Update server config settings
   */
  @Patch('config')
  @Security('adminAuth')
  public async updateServerConfig(
    @Body() body: UpdateServerConfigDTO,
  ): Promise<ApiResponse<ServerConfigDTO>> {
    const SERVER_CONFIG_FILE = fileSystemService.getExternalPath(
      'resources/config/serverConfig.json',
    );

    const defaultServerConfig = {
      autoScan: false,
      autoScanPeriod: 'never',
      generateChapters: 'never',
      autoSelectTracks: true,
      preferAudioLan: 'es-ES',
      preferSubsLan: 'es-ES',
      subsMode: 'autoSubs',
      tempTranscodeFolder: '',
      transcodeBuffer: 60,
      transcodePreset: 'veryfast',
      maxTranscodeProcesses: 4,
      automaticUpdates: false,
    };

    fileSystemService.createJSONFile(SERVER_CONFIG_FILE, defaultServerConfig);
    const updates = body;
    let configData = JSON.parse(fileSystemService.readFileSync(SERVER_CONFIG_FILE, 'utf8'));

    configData = { ...configData, ...updates };

    fileSystemService.writeFile(SERVER_CONFIG_FILE, JSON.stringify(configData, null, 2));

    return ApiResponse.success(configData, messages.success.update);
  }
}
