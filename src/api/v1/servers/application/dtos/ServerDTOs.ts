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

export interface ServerResponse {
  status: string;
  message: string;
  data?: any;
}

export interface ServerConfigDTO {
  autoScan: boolean;
  autoScanPeriod: string;
  generateChapters: string;
  autoSelectTracks: boolean;
  preferAudioLan: string;
  preferSubsLan: string;
  subsMode: string;
  tempTranscodeFolder: string;
  transcodeBuffer: number;
  transcodePreset: string;
  maxTranscodeProcesses: number;
  automaticUpdates: boolean;
}

export interface ServerConfigResponse {
  key?: string;
  value?: any;
  [key: string]: any;
}

export interface UpdateServerConfigDTO {
  autoScan?: boolean;
  autoScanPeriod?: string;
  generateChapters?: string;
  autoSelectTracks?: boolean;
  preferAudioLan?: string;
  preferSubsLan?: string;
  subsMode?: string;
  tempTranscodeFolder?: string;
  transcodeBuffer?: number;
  transcodePreset?: string;
  maxTranscodeProcesses?: number;
  automaticUpdates?: boolean;
}
