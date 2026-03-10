import crypto from 'crypto';
import type { Express } from 'express';
import fs from 'fs';
import http from 'http';
import https from 'https';
import upnp from 'nat-upnp';
import ngrok from 'ngrok';
import os from 'os';
import { ServerModel } from '@/api/v1/servers/infrastructure/persistence/models/ServerModel';
import { fileSystemService } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { appServer } from '@/index';
import logger from '@/utils/logger';

const configLogger = logger.child({ category: 'Config' });
const sslLogger = logger.child({ category: 'SSL' });
const streamingLogger = logger.child({ category: 'Streaming Server' });
const tunnelLogger = logger.child({ category: 'Tunnel' });
const upnpLogger = logger.child({ category: 'UPnP' });

export class ServerConfigService {
  static serverConfig: ServerModel;
  static sslOptions: { key: string; cert: string; passphrase?: string } | null = null;
  static httpServer: http.Server | null = null;
  static httpsServer: https.Server | null = null;
  public static mainServer: http.Server | https.Server;

  static async loadOrCreateServerConfig() {
    let config: ServerModel | null = null;

    try {
      [config] = await ServerModel.find({ take: 1 });
      if (!config) {
        const hostname = os.hostname(); // Get computer hostname
        config = ServerModel.createWithDefaults({
          name: hostname || 'Server',
        }) as ServerModel;
        await config.save();
        configLogger.info('Created new server config with defaults.');
      }
      ServerConfigService.serverConfig = config;
    } catch (err) {
      configLogger.error(err, 'Error creating server config');
    }

    if (!config) {
      streamingLogger.error('No server config found.');
      return;
    }

    // Ensure JWT_SECRET exists
    const secretPath = fileSystemService.getExternalPath('resources/config/jwt_secret');
    if (!fs.existsSync(secretPath)) {
      const secret = crypto.randomBytes(32).toString('hex'); // Generate secure 256-bit key
      fs.writeFileSync(secretPath, secret, { mode: 0o600 }); // Restrict permissions
      configLogger.info('Generated and saved new JWT_SECRET.');
    }
    process.env.JWT_SECRET = fs.readFileSync(secretPath, 'utf-8');

    // Load SSL if enabled
    if (config.httpsEnabled && config.sslCertPath && config.sslKeyPath) {
      try {
        ServerConfigService.sslOptions = {
          cert: fs.readFileSync(config.sslCertPath, 'utf-8'),
          key: fs.readFileSync(config.sslKeyPath, 'utf-8'),
        };
        if (config.sslPassword) {
          ServerConfigService.sslOptions.passphrase = config.sslPassword; // Assume secure storage
        }
        sslLogger.info('Loaded SSL certificates.');
      } catch (err) {
        sslLogger.error(err, 'Error loading SSL certificates');
        config.httpsEnabled = false;
        await config.save();
      }
    }

    // Apply remote access filters
    if (config.allowRemoteConnections && config.remoteIpFilter) {
      const filters = config.remoteIpFilter.split(',').map((f) => f.trim());
      appServer.use((req: any, res: any, next) => {
        const clientIp = req.ip;
        const isAllowed =
          config.remoteIpFilterMode === 'whitelist'
            ? filters.some((filter) => clientIp?.match(new RegExp(filter)))
            : !filters.some((filter) => clientIp?.match(new RegExp(filter)));
        if (!isAllowed) {
          return res.status(403).json({ error: 'Remote access denied' });
        }
        next();
      });
    }

    // Set proxy hosts for X-Forwarded-For
    if (config.proxyHosts) {
      appServer.set(
        'trust proxy',
        config.proxyHosts.split(',').map((h) => h.trim()),
      );
    }

    configLogger.info('Server config loaded.');
  }

  static async startServer(app: Express) {
    if (ServerConfigService.mainServer && ServerConfigService.mainServer.listening) {
      await new Promise<void>((resolve, reject) => {
        ServerConfigService.mainServer.close((err) => {
          if (err) {
            streamingLogger.error(err, 'Error closing previous server');
            return reject(err);
          }
          resolve();
        });
      });
      streamingLogger.info('Previous server closed.');
    }

    if (!ServerConfigService.serverConfig) {
      streamingLogger.error('Server config not loaded');
      return;
    }

    if (!ServerConfigService.serverConfig.httpsPort && !ServerConfigService.serverConfig.httpPort) {
      streamingLogger.error('No ports configured');
      return;
    }

    // Start HTTP server
    ServerConfigService.httpServer = http.createServer(app);
    ServerConfigService.httpServer.listen(ServerConfigService.serverConfig.httpPort, () => {
      streamingLogger.info(
        `HTTP server started on http://localhost:${ServerConfigService.serverConfig.httpPort}`,
      );
    });

    // Start HTTPS server if enabled
    if (ServerConfigService.serverConfig.httpsEnabled && ServerConfigService.sslOptions) {
      ServerConfigService.httpsServer = https.createServer(ServerConfigService.sslOptions, app);
      ServerConfigService.httpsServer.listen(ServerConfigService.serverConfig.httpsPort, () => {
        streamingLogger.info(
          `HTTPS server started on https://localhost:${ServerConfigService.serverConfig.httpsPort}`,
        );
      });
    }

    // Set main server
    ServerConfigService.mainServer = ServerConfigService.serverConfig.httpsEnabled
      ? (ServerConfigService.httpsServer as any)
      : ServerConfigService.httpServer;

    // Handle forceHttps
    if (
      ServerConfigService.serverConfig.forceHttps &&
      ServerConfigService.serverConfig.httpsEnabled
    ) {
      app.use((req, res, next) => {
        if (!req.secure) {
          res.redirect(
            `https://${req.headers.host?.replace(
              `:${ServerConfigService.serverConfig.httpPort}`,
              `:${ServerConfigService.serverConfig.httpsPort}`,
            )}${req.url}`,
          );
        } else {
          next();
        }
      });
    }

    // Setup tunnel if enabled
    if (
      ServerConfigService.serverConfig.tunnelEnabled &&
      !ServerConfigService.serverConfig.tunnelUrl
    ) {
      try {
        const port = ServerConfigService.serverConfig.httpsEnabled
          ? ServerConfigService.serverConfig.httpsPort
          : ServerConfigService.serverConfig.httpPort;
        const url = await ngrok.connect({
          port,
          proto: 'http',
        });
        ServerConfigService.serverConfig.tunnelUrl = url;
        await ServerConfigService.serverConfig.save();
        tunnelLogger.info(`ngrok tunnel established at ${url}`);
      } catch (err) {
        tunnelLogger.error(err, 'Failed to establish ngrok tunnel');
      }
    }
  }

  static async setupPortMapping() {
    if (!ServerConfigService.serverConfig.enableAutoPortMapping) return;

    const client = upnp.createClient();
    const portsToMap = [
      {
        private: ServerConfigService.serverConfig.httpPort,
        public: ServerConfigService.serverConfig.publicHttpPort,
        protocol: 'tcp',
      },
      {
        private: ServerConfigService.serverConfig.httpsPort,
        public: ServerConfigService.serverConfig.publicHttpsPort,
        protocol: 'tcp',
      },
    ];

    for (const mapping of portsToMap) {
      client.portMapping(
        {
          public: mapping.public,
          private: mapping.private,
          protocol: mapping.protocol,
          ttl: 0,
        },
        (err: any) => {
          if (err) {
            upnpLogger.error(err, `Error mapping port ${mapping.private} to ${mapping.public}`);
          } else {
            upnpLogger.info(`Mapped port ${mapping.private} to public ${mapping.public}`);
          }
        },
      );
    }
  }

  static async restartServer() {
    streamingLogger.info('Restarting server...');
    await ServerConfigService.startServer(appServer);
    await ServerConfigService.setupPortMapping();
  }
}
