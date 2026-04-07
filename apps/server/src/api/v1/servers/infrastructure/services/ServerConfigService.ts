import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import os from 'node:os';
import type { Express, NextFunction, Request, Response } from 'express';
import ngrok from 'ngrok';
import { ServerModel } from '@/api/v1/servers/infrastructure/persistence/models/ServerModel';
import { fileSystemService } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { appServer } from '@/index';
import logger from '@/utils/logger';

const configLogger = logger.child({ category: 'Config' });
const sslLogger = logger.child({ category: 'SSL' });
const streamingLogger = logger.child({ category: 'Streaming Server' });
const tunnelLogger = logger.child({ category: 'Tunnel' });

export const ServerConfigService = {
  serverConfig: undefined as unknown as ServerModel,
  sslOptions: null as { key: string; cert: string; passphrase?: string } | null,
  httpServer: null as http.Server | null,
  httpsServer: null as https.Server | null,
  mainServer: undefined as unknown as http.Server | https.Server,

  async loadOrCreateServerConfig() {
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
      this.serverConfig = config;
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
        this.sslOptions = {
          cert: fs.readFileSync(config.sslCertPath, 'utf-8'),
          key: fs.readFileSync(config.sslKeyPath, 'utf-8'),
        };
        if (config.sslPassword) {
          this.sslOptions.passphrase = config.sslPassword; // Assume secure storage
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
      appServer.use((req: Request, res: Response, next: NextFunction) => {
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
  },

  async startServer(app: Express) {
    if (this.mainServer?.listening) {
      await new Promise<void>((resolve, reject) => {
        this.mainServer.close((err) => {
          if (err) {
            streamingLogger.error(err, 'Error closing previous server');
            return reject(err);
          }
          resolve();
        });
      });
      streamingLogger.info('Previous server closed.');
    }

    if (!this.serverConfig) {
      streamingLogger.error('Server config not loaded');
      return;
    }

    if (!this.serverConfig.httpsPort && !this.serverConfig.httpPort) {
      streamingLogger.error('No ports configured');
      return;
    }

    // Start HTTP server
    this.httpServer = http.createServer(app);
    this.httpServer.listen(this.serverConfig.httpPort, () => {
      streamingLogger.info(`HTTP server started on http://localhost:${this.serverConfig.httpPort}`);
    });

    // Start HTTPS server if enabled
    if (this.serverConfig.httpsEnabled && this.sslOptions) {
      this.httpsServer = https.createServer(this.sslOptions, app);
      this.httpsServer.listen(this.serverConfig.httpsPort, () => {
        streamingLogger.info(
          `HTTPS server started on https://localhost:${this.serverConfig.httpsPort}`,
        );
      });
    }

    // Set main server
    const selectedMainServer = this.serverConfig.httpsEnabled ? this.httpsServer : this.httpServer;
    if (!selectedMainServer) {
      streamingLogger.error('Failed to initialize main server instance');
      return;
    }
    this.mainServer = selectedMainServer;

    // Handle forceHttps
    if (this.serverConfig.forceHttps && this.serverConfig.httpsEnabled) {
      app.use((req, res, next) => {
        if (!req.secure) {
          res.redirect(
            `https://${req.headers.host?.replace(
              `:${this.serverConfig.httpPort}`,
              `:${this.serverConfig.httpsPort}`,
            )}${req.url}`,
          );
        } else {
          next();
        }
      });
    }

    // Setup tunnel if enabled
    if (this.serverConfig.tunnelEnabled && !this.serverConfig.tunnelUrl) {
      try {
        const port = this.serverConfig.httpsEnabled
          ? this.serverConfig.httpsPort
          : this.serverConfig.httpPort;
        const url = await ngrok.connect({
          port,
          proto: 'http',
        });
        this.serverConfig.tunnelUrl = url;
        await this.serverConfig.save();
        tunnelLogger.info(`ngrok tunnel established at ${url}`);
      } catch (err) {
        tunnelLogger.error(err, 'Failed to establish ngrok tunnel');
      }
    }
  },

  async restartServer() {
    streamingLogger.info('Restarting server...');
    await this.startServer(appServer);
  },
};
