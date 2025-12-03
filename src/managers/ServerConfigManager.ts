import { ServerModel } from "@/api/v0/servers/infrastructure/persistence/models/ServerModel";
import { fileSystemService } from "@/api/v0/shared/infrastructure/adapters/di/container";
import crypto from "crypto";
import { Express } from "express";
import fs from "fs";
import http from "http";
import https from "https";
import upnp from "nat-upnp";
import ngrok from "ngrok";
import os from "os";
import { appServer } from "..";

export class ServerConfigManager {
  static serverConfig: ServerModel;
  static sslOptions: { key: string; cert: string; passphrase?: string } | null =
    null;
  static httpServer: http.Server | null = null;
  static httpsServer: https.Server | null = null;
  public static mainServer: http.Server | https.Server;

  static async loadOrCreateServerConfig() {
    let config: ServerModel | null = null;

    try {
      config = await ServerModel.findOne();
      if (!config) {
        const hostname = os.hostname(); // Get computer hostname
        config = await ServerModel.create({
          name: hostname || "Server",
        });
        console.log("[Config]: Created new server config with defaults.");
      }
      this.serverConfig = config;
    } catch (err) {
      console.error("[Config]: Error creating server config:", err);
    }

    if (!config) return;

    // Ensure JWT_SECRET exists
    const secretPath = fileSystemService.getExternalPath(
      "resources/config/jwt_secret"
    );
    if (!fs.existsSync(secretPath)) {
      const secret = crypto.randomBytes(32).toString("hex"); // Generate secure 256-bit key
      fs.writeFileSync(secretPath, secret, { mode: 0o600 }); // Restrict permissions
      console.log("[Config]: Generated and saved new JWT_SECRET.");
    }
    process.env.JWT_SECRET = fs.readFileSync(secretPath, "utf-8");

    // Load SSL if enabled
    if (config.httpsEnabled && config.sslCertPath && config.sslKeyPath) {
      try {
        this.sslOptions = {
          cert: fs.readFileSync(config.sslCertPath, "utf-8"),
          key: fs.readFileSync(config.sslKeyPath, "utf-8"),
        };
        if (config.sslPassword) {
          this.sslOptions.passphrase = config.sslPassword; // Assume secure storage
        }
        console.log("[SSL]: Loaded SSL certificates.");
      } catch (err) {
        console.error("[SSL]: Error loading SSL certificates:", err);
        config.httpsEnabled = false;
        await config.save();
      }
    }

    // Apply remote access filters
    if (config.allowRemoteConnections && config.remoteIpFilter) {
      const filters = config.remoteIpFilter.split(",").map((f) => f.trim());
      appServer.use((req: any, res: any, next) => {
        const clientIp = req.ip;
        const isAllowed =
          config.remoteIpFilterMode === "whitelist"
            ? filters.some((filter) => clientIp?.match(new RegExp(filter)))
            : !filters.some((filter) => clientIp?.match(new RegExp(filter)));
        if (!isAllowed) {
          return res.status(403).json({ error: "Remote access denied" });
        }
        next();
      });
    }

    // Set proxy hosts for X-Forwarded-For
    if (config.proxyHosts) {
      appServer.set(
        "trust proxy",
        config.proxyHosts.split(",").map((h) => h.trim())
      );
    }

    console.log("[Config]: Server config loaded.");
  }

  static async startServer(app: Express) {
    if (this.mainServer && this.mainServer.listening) {
      await new Promise<void>((resolve, reject) => {
        this.mainServer.close((err) => {
          if (err) {
            console.error(
              "[Streaming Server]: Error closing previous server.",
              err
            );
            return reject(err);
          }
          resolve();
        });
      });
      console.log("[Streaming Server]: Previous server closed.");
    }

    // Start HTTP server
    this.httpServer = http.createServer(app);
    this.httpServer.listen(this.serverConfig.httpPort, () => {
      console.log(
        `[Streaming Server]: HTTP server started on http://localhost:${this.serverConfig.httpPort}`
      );
    });

    // Start HTTPS server if enabled
    if (this.serverConfig.httpsEnabled && this.sslOptions) {
      this.httpsServer = https.createServer(this.sslOptions, app);
      this.httpsServer.listen(this.serverConfig.httpsPort, () => {
        console.log(
          `[Streaming Server]: HTTPS server started on https://localhost:${this.serverConfig.httpsPort}`
        );
      });
    }

    // Set main server
    this.mainServer = this.serverConfig.httpsEnabled
      ? (this.httpsServer as any)
      : this.httpServer;

    // Handle forceHttps
    if (this.serverConfig.forceHttps && this.serverConfig.httpsEnabled) {
      app.use((req, res, next) => {
        if (!req.secure) {
          res.redirect(
            `https://${req.headers.host?.replace(
              `:${this.serverConfig.httpPort}`,
              `:${this.serverConfig.httpsPort}`
            )}${req.url}`
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
          proto: "http",
        });
        this.serverConfig.tunnelUrl = url;
        await this.serverConfig.save();
        console.log(`[Tunnel]: ngrok tunnel established at ${url}`);
      } catch (err) {
        console.error("[Tunnel]: Failed to establish ngrok tunnel:", err);
      }
    }
  }

  static async setupPortMapping() {
    if (!this.serverConfig.enableAutoPortMapping) return;

    const client = upnp.createClient();
    const portsToMap = [
      {
        private: this.serverConfig.httpPort,
        public: this.serverConfig.publicHttpPort,
        protocol: "tcp",
      },
      {
        private: this.serverConfig.httpsPort,
        public: this.serverConfig.publicHttpsPort,
        protocol: "tcp",
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
            console.error(
              `[UPnP]: Error mapping port ${mapping.private} to ${mapping.public}:`,
              err
            );
          } else {
            console.log(
              `[UPnP]: Mapped port ${mapping.private} to public ${mapping.public}`
            );
          }
        }
      );
    }
  }

  static async restartServer() {
    console.log("[Streaming Server]: Restarting server...");
    await this.startServer(appServer);
    await this.setupPortMapping();
  }
}
