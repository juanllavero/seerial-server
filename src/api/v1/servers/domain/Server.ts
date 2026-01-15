import { User } from "../../users/domain/User";

export interface Server {
  id: string;
  name: string;
  // HTTP port configuration
  httpPort: number;
  // HTTPS port configuration
  httpsPort: number;
  // Tunnel configuration
  tunnelEnabled: boolean;
  tunnelUrl?: string;
  // HTTPS enablement and certificate configuration
  httpsEnabled: boolean;
  sslCertPath?: string;
  sslKeyPath?: string;
  sslPassword?: string;
  // Custom URL for access
  customUrl?: string;
  // Proxy hosts for X-Forwarded-For
  proxyHosts?: string;
  // Force HTTPS
  forceHttps: boolean;
  // Remote access options
  allowRemoteConnections: boolean;
  remoteIpFilter?: string;
  remoteIpFilterMode: string;
  enableAutoPortMapping: boolean;
  publicHttpPort: number;
  publicHttpsPort: number;
  users: User[];
}
