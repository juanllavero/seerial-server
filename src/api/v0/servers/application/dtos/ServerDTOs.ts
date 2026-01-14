import { ApiResponse } from "@/api/v0/shared/application/dtos/DTOs";

export interface UpdateServerDTO {
  name?: string;
  httpPort?: number;
  httpsPort?: number;
  tunnelEnabled?: boolean;
  tunnelUrl?: string;
  httpsEnabled?: boolean;
  sslCertPath?: string;
  sslKeyPath?: string;
  sslPassword?: string;
  customUrl?: string;
  proxyHosts?: string;
  forceHttps?: boolean;
  allowRemoteConnections?: boolean;
  remoteIpFilter?: string;
  remoteIpFilterMode?: string;
  enableAutoPortMapping?: boolean;
  publicHttpPort?: number;
  publicHttpsPort?: number;
}

export interface ServerResponse extends ApiResponse {}
