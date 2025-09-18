import { exec } from "child_process";
import cors from "cors";
import { app, Menu, shell, Tray } from "electron";
import express from "express";
import fs from "fs";
import hostile from "hostile";
import http from "http";
import https from "https";
import open from "open";
import os from "os";
import path from "path";
import sudo from "sudo-prompt";
import { SequelizeManager } from "./db/SequelizeManager";
import AuthMiddleware from "./middleware/authMiddleware";
import * as routes from "./routes/index";
import { MovieDBWrapper } from "./theMovieDB/MovieDB";
import * as ConfigManager from "./utils/ConfigManager";
import { API_URL } from "./utils/constants";
import { FilesManager } from "./utils/FilesManager";
import { findAvailablePort } from "./utils/PortFinder";
import { downloadYtDlp } from "./utils/YoutubeDownloader";
import { WebSocketManager } from "./WebSockets/WebSocketManager";

process.env.APP_ROOT = path.join(__dirname, "../../");

// Server settings
export const appServer = express();

// Middleware to allow CORS
appServer.use(
  cors({
    origin: "*",
    exposedHeaders: ["Content-Range", "Accept-Ranges", "Content-Length"],
    methods: ["GET", "PUT", "POST", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "authorization"],
  })
);

// Middleware to process JSON
appServer.use(express.json({ limit: "50mb" }));
appServer.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve files (for video and audio folders)
const videoPath = FilesManager.getExternalPath("resources");
appServer.use("/media", express.static(videoPath));

// Server variable
export let server: http.Server | https.Server;

// Create WebSocket Manager
export let wsManager: WebSocketManager;

let currentPort: number;

// Certificates
let sslCert: string | null = null;
let sslKey: string | null = null;

/**
 * Starts the server on the specified port.
 * @param port - the port to start the server on
 */
async function startServer(port: number) {
  if (server && server.listening) {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          // Reject promise if there is an error
          console.error(
            "[Streaming Server]: Error closing previous server.",
            err
          );
          return reject(err);
        }
        // Resolve if the server is closed
        resolve();
      });
    });
    console.log("[Streaming Server]: Previous server closed.");
  }

  // Check if we have the certificate and key loaded.
  if (sslCert && sslKey) {
    // Create an HTTPS server
    const sslOptions = {
      key: sslKey,
      cert: sslCert,
    };
    //server = https.createServer(sslOptions, appServer); // Commented for development purposes
    server = http.createServer(appServer);
    console.log("[Streaming Server]: Starting HTTPS server...");
  } else {
    // Fallback to a standard HTTP server if no certs are found.
    server = http.createServer(appServer);
    console.warn(
      "[Streaming Server]: SSL Certificates not found. Starting HTTP server as a fallback."
    );
  }

  wsManager = WebSocketManager.getInstance(server); // Reinitialize WebSocketManager

  server
    .listen(port, () => {
      currentPort = port;
      const protocol = sslCert && sslKey ? "https" : "http";
      console.log(
        `[Streaming Server]: Server started on ${protocol}://localhost:${port}`
      );
    })
    .on("error", (err) => {
      console.error("[Streaming Server]: Error starting server:", err);
      app.quit();
    });
}

/**
 * Restarts the server on a new port.
 * @param newPort - the new port.
 */
export async function restartServer(newPort: number) {
  console.log(`[Streaming Server]: Port restarting to ${newPort}...`);
  ConfigManager.setPort(newPort);
  await ConfigManager.saveConfig();
  await startServer(newPort);
}

//#region TRAY ICON
let tray: Tray | null = null;
function createTray() {
  const iconPath = path.join(
    __dirname,
    "assets",
    "icons",
    process.platform === "win32" ? "icon.ico" : "icon.png"
  );

  tray = new Tray(iconPath);

  // Obtener estado actual del inicio automático
  const loginSettings = app.getLoginItemSettings();
  let startAtLoginChecked = loginSettings.openAtLogin;

  // Context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Seerial...",
      click: () => {
        shell.openExternal("https://app.seerial.es");
      },
    },
    { type: "separator" },
    {
      label: "Start Seerial Media Server at Login",
      type: "checkbox",
      checked: startAtLoginChecked,
      click: (menuItem) => {
        const enabled = menuItem.checked;
        app.setLoginItemSettings({
          openAtLogin: enabled,
          path: process.execPath,
          args: [], // start args if necessary
        });
        startAtLoginChecked = enabled;
      },
    },
    { type: "separator" },
    {
      label: "About Seerial",
      click: () => {
        shell.openExternal("https://seerial.es");
      },
    },
    { type: "separator" },
    {
      label: "Exit",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Seerial App");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    // Do nothing
  });

  tray.on("double-click", () => {
    shell.openExternal("https://app.seerial.es");
  });
}
//#endregion

function addServerRoutes() {
  const authMiddleware = new AuthMiddleware();

  // Access restricted to owner and shared users
  appServer.use("/", authMiddleware.requireAccess, routes.getMediaRoutes);
  appServer.use("/", authMiddleware.requireAccess, routes.getStatusRoutes);

  // Fast access routes for shared users and owner
  appServer.use(
    "/",
    authMiddleware.requireAccessFast,
    routes.getMediaInfoRoutes
  );
  appServer.use("/", authMiddleware.requireAccessFast, routes.getVideoRoutes);
  appServer.use("/", authMiddleware.requireAccessFast, routes.getAudioRoutes);
  appServer.use("/", authMiddleware.requireAccessFast, routes.getColorsRoutes);
  appServer.use("/", authMiddleware.requireAccessFast, routes.getImagesRoutes);

  // Authenticated routes (only server owner)
  appServer.use("/", authMiddleware.requireOwner, routes.folderRoutes);
  appServer.use("/", authMiddleware.requireOwner, routes.deleteDataRoutes);
  appServer.use("/", authMiddleware.requireOwner, routes.postDataRoutes);
  appServer.use("/", authMiddleware.requireOwner, routes.updateDataRoutes);
  appServer.use("/", authMiddleware.requireOwner, routes.getHTPCSettings);
  appServer.use("/", authMiddleware.requireOwner, routes.getServerSettings);
  appServer.use("/", authMiddleware.requireOwner, routes.getWebSettings);

  /**
   * Endpoint to restart the server with a specific port
   * @route POST /server/restart
   * @param {number} port.required - The port to restart the server on
   */
  appServer.post("/server/restart", async (req: any, res: any) => {
    const { port } = req.body;

    if (!port || typeof port !== "number" || port < 1024 || port > 65535) {
      return res.status(400).json({
        error: "Invalid port. It must be a number between 1024 and 65535.",
      });
    }

    try {
      await restartServer(port);
      res
        .status(200)
        .json({ message: `Server restarted successfully on port ${port}.` });
    } catch (error) {
      console.error("Error restarting server:", error);
      res.status(500).json({ error: "Failed to restart server." });
    }
  });
}

//#region SERVER REGISTRATION & SSL
let localIp: string = "127.0.0.1";

async function getServerDetails() {
  // Get Server Name
  const name = os.hostname();
  const networkInterfaces = os.networkInterfaces();
  let foundIp = "127.0.0.1";

  // Get local IP
  for (const interfaceDetails of Object.values(networkInterfaces)) {
    if (!interfaceDetails) continue;
    for (const detail of interfaceDetails) {
      // Find the first non-internal IPv4 address that is on a private network
      if (detail.family === "IPv4" && !detail.internal) {
        // Prioritize common private network ranges
        if (
          detail.address.startsWith("192.168.") ||
          detail.address.startsWith("10.") ||
          detail.address.startsWith("172.16.")
        ) {
          foundIp = detail.address;
          break; // Found a good candidate, stop searching this interface
        }
      }
    }
    if (foundIp !== "127.0.0.1") {
      break; // Found a good candidate, stop searching other interfaces
    }
  }

  localIp = foundIp; // Update the global variable
  console.log(`[IP Discovery]: Discovered Local IP: ${localIp}`);

  // Get public IP
  let publicIp = (await getPublicIp()) ?? "Not Available";

  return { name, ip: localIp, publicIp };
}

/**
 * New function to fetch the SSL certificate from the central API and save it locally.
 */
async function fetchAndSaveSslCertificate(): Promise<boolean> {
  if (!authToken || !serverId) {
    console.error(
      "[SSL]: Cannot fetch certificate without auth token and server ID."
    );
    return false;
  }

  console.log("[SSL]: Requesting SSL certificate from central API...");
  try {
    const res = await fetch(`${API_URL}/servers/${serverId}/certificate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (res.ok) {
      const { certificate, privateKey } = await res.json();
      fs.writeFileSync("cert.pem", certificate);
      fs.writeFileSync("key.pem", privateKey);
      // Load them into memory immediately
      sslCert = certificate;
      sslKey = privateKey;
      console.log("[SSL]: Certificate and key successfully fetched and saved.");
      return true;
    } else {
      console.error(
        "[SSL]: Failed to fetch certificate. Status:",
        res.status,
        await res.text()
      );
      return false;
    }
  } catch (error) {
    console.error("[SSL]: Error fetching certificate:", error);
    return false;
  }
}

async function loginAndRegisterServer(port: number) {
  const initRes = await fetch(`${API_URL}/claim/initiate`, { method: "POST" });
  const { claim_token } = await initRes.json();

  const claimUrl = `${API_URL}/login?token=${claim_token}`;
  console.log(
    `If the web browser is not opened automatically, open this link: ${claimUrl}`
  );
  open(claimUrl);

  const finalJwt = await pollForCompletion(claim_token);

  if (finalJwt) {
    console.log(
      "Authorization successful. Registering server with the central API..."
    );

    try {
      const serverDetails = await getServerDetails();
      const registerRes = await fetch(`${API_URL}/servers/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Use the finalJwt as the Authorization header
          Authorization: `Bearer ${finalJwt}`,
        },
        body: JSON.stringify({ ...serverDetails, port }),
      });

      if (registerRes.ok) {
        const result = await registerRes.json();
        console.log(
          "Server registered successfully in the central database.",
          result
        );

        fs.writeFileSync("auth.token", String(finalJwt));
        fs.writeFileSync(
          FilesManager.getExternalPath("resources/config/server.id"),
          String(result.id)
        );
        serverId = result.id;
        authToken = String(finalJwt);
        lastKnownPublicIp = serverDetails.publicIp;

        // After successful registration, set the DNS record and fetch the certificate.
        await updateDnsRecord();
        await fetchAndSaveSslCertificate();
      } else {
        let errorInfo;
        const contentType = registerRes.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          errorInfo = await registerRes.json();
        } else {
          errorInfo = await registerRes.text();
        }

        console.error("Failed to register server. Status:", registerRes.status);
        console.error("Error details:", errorInfo);
      }
    } catch (error) {
      console.error("An error occurred during server registration:", error);
    }
  } else {
    console.log(
      "Server registration failed: Could not get authorization token."
    );
  }
}

async function pollForCompletion(token: any) {
  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      const statusRes = await fetch(`${API_URL}/claim/status/${token}`);
      if (statusRes.status !== 202) {
        clearInterval(interval);
        if (statusRes.ok) {
          const data = await statusRes.json();
          resolve(data.token);
        } else {
          resolve(null);
        }
      }
    }, 3000); // Fetch every 3 seconds
  });
}
//#endregion

//#region IP MONITORING
let serverId: string | null = null;
let authToken: string | null = null;
let lastKnownPublicIp: string | null = null;

/**
 * Get public IP
 * @returns string or null
 */
async function getPublicIp(): Promise<string | null> {
  try {
    const response = await fetch("https://api.ipify.org");
    if (response.ok) {
      return await response.text();
    }
  } catch (error) {
    console.warn("Could not fetch public IP:", error);
  }
  return null;
}

/**
 * New function to notify the central server about our IP for DNS records.
 */
async function updateDnsRecord(force: boolean = false) {
  if (!authToken || !serverId || !lastKnownPublicIp) {
    console.log("[DNS Update]: Missing data. Skipping DNS update.");
    return;
  }
  console.log(
    `[DNS Update]: Notifying central server to update DNS for ${serverId} to ${lastKnownPublicIp}`
  );
  try {
    const res = await fetch(`${API_URL}/servers/${serverId}/dns`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ publicIp: lastKnownPublicIp, force }),
    });
    if (res.ok) {
      console.log("[DNS Update]: DNS update request sent successfully.");
    } else {
      console.error(
        "[DNS Update]: Failed to send DNS update request. Status:",
        res.status,
        await res.text()
      );
    }
  } catch (error) {
    console.error("[DNS Update]: Error sending DNS update request:", error);
  }
}

/**
 * Scan the public IP every 30 seconds and update it in the central server if changed
 */
function startPublicIpMonitor() {
  console.log("[IP Monitor]: Starting public IP monitor...");

  setInterval(async () => {
    if (!authToken) {
      return;
    }

    const currentPublicIp = await getPublicIp();

    if (currentPublicIp && currentPublicIp !== lastKnownPublicIp) {
      console.log(
        `[IP Monitor]: Public IP changed from ${lastKnownPublicIp} to ${currentPublicIp}. Updating...`
      );
      lastKnownPublicIp = currentPublicIp;
      // Update both the server's IP in the DB and its DNS record.
      const updateDbPromise = fetch(`${API_URL}/servers/${serverId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ publicIp: currentPublicIp }),
      });
      // Run both updates in parallel.
      await Promise.all([updateDbPromise, updateDnsRecord()]);
      console.log("[IP Monitor]: IP update process completed.");
    }
  }, 30000); // 30 seconds
}
//#endregion

//#region HOST FILE MODIFICATION
/**
 * --- NEW FUNCTION ---
 * Flushes the operating system's DNS cache.
 */
async function flushDnsCache() {
  console.log("[DNS Cache]: Attempting to flush DNS cache...");
  const sudoOptions = { name: "Seerial Media Server" };

  const command = (() => {
    switch (process.platform) {
      case "win32":
        return "ipconfig /flushdns";
      case "darwin":
        return "dscacheutil -flushcache; killall -HUP mDNSResponder";
      case "linux":
        return "resolvectl flush-caches"; // This is for systemd-resolved
      default:
        return null;
    }
  })();

  if (!command) {
    console.log(
      `[DNS Cache]: No DNS flush command known for platform: ${process.platform}`
    );
    return;
  }

  const executor = (
    cmd: string,
    callback: (error: any, stdout: any, stderr: any) => void
  ) => {
    // Windows flushdns doesn't require sudo
    if (process.platform === "win32") {
      return exec(cmd, callback);
    }
    // macOS and Linux commands often do
    return sudo.exec(cmd, sudoOptions, callback);
  };

  await new Promise<void>((resolve) => {
    executor(command, (error, stdout, stderr) => {
      if (error) {
        console.error(
          `[DNS Cache]: Failed to flush DNS cache.`,
          stderr || error.message
        );
      } else {
        console.log(`[DNS Cache]: DNS cache flushed successfully.`);
      }
      // This is a best-effort operation, so we always resolve.
      resolve();
    });
  });
}

/**
 * --- NEW FUNCTION ---
 * Automatically manages the hosts file to redirect the public domain to the local IP,
 * avoiding NAT loopback issues. It will prompt the user for admin privileges.
 */
async function manageHostsFile() {
  if (!serverId) return;
  const domain = `${serverId}.seerial.es`;
  const sudoOptions = { name: "Seerial Media Server" };

  try {
    const lines = hostile.get(false);
    const existingEntry = lines.find(
      (line) => Array.isArray(line) && line[1] === domain
    );

    if (existingEntry && existingEntry[0] === localIp) {
      console.log(`[Hosts File]: Entry for ${domain} is already correct.`);
      return;
    }

    console.log(
      `[Hosts File]: Setting hosts file entry: ${localIp} -> ${domain}`
    );
    // The command needs to be escaped properly for the shell
    const command = `node -e "require('hostile').set('${localIp}', '${domain}')"`;

    await new Promise<void>((resolve, reject) => {
      sudo.exec(command, sudoOptions, (error, stdout, stderr) => {
        if (error) {
          console.error(
            "[Hosts File]: Failed to set hosts file entry.",
            stderr
          );
          return reject(error);
        }
        console.log("[Hosts File]: Entry set successfully.");
        resolve();
      });
    });
  } catch (err) {
    console.error("[Hosts File]: Could not manage hosts file.", err);
  }
}

/**
 * --- NEW FUNCTION ---
 * Cleans up the hosts file entry on application exit.
 */
async function cleanupHostsFile() {
  if (!serverId) return;
  const domain = `${serverId}.seerial.es`;
  const sudoOptions = { name: "Seerial Media Server" };
  console.log(`[Hosts File]: Cleaning up hosts file entry for ${domain}...`);

  try {
    const command = `node -e "require('hostile').remove('${localIp}', '${domain}')"`;
    await new Promise<void>((resolve, reject) => {
      sudo.exec(command, sudoOptions, async (error, _stdout, stderr) => {
        // We don't treat errors here as critical, as the app is closing.
        if (error)
          console.warn("[Hosts File]: Could not remove entry on exit.", stderr);
        else console.log("[Hosts File]: Cleanup successful.");

        // After successfully setting the hosts file, flush the DNS cache.
        await flushDnsCache();

        resolve();
      });
    });
  } catch (err) {
    console.warn("[Hosts File]: Error during cleanup.", err);
  }
}
//#endregion

// Start the app
app.whenReady().then(async () => {
  // Check dependencies and install if necessary (python, pip, yt-dl)
  await downloadYtDlp();

  try {
    if (fs.existsSync("auth.token"))
      authToken = fs.readFileSync("auth.token", "utf-8");
    const serverIdPath = FilesManager.getExternalPath(
      "resources/config/server.id"
    );
    if (fs.existsSync(serverIdPath))
      serverId = fs.readFileSync(serverIdPath, "utf-8");

    // At startup, try to load the SSL certificate from local files.
    if (fs.existsSync("cert.pem") && fs.existsSync("key.pem")) {
      sslCert = fs.readFileSync("cert.pem", "utf-8");
      sslKey = fs.readFileSync("key.pem", "utf-8");
      console.log("[SSL]: Certificate and key loaded from local files.");
    }

    // This call now also sets the global 'localIp' variable
    const serverDetails = await getServerDetails();

    if (authToken && serverId) {
      console.log("[Auth]: Token and Server ID loaded from files.");
      lastKnownPublicIp = await getPublicIp();
    }
  } catch (error) {
    console.error("Error reading auth.token or server.id:", error);
  }

  // Initialize Database
  SequelizeManager.initializeDB();

  // Initialize Folders
  FilesManager.initFolders();

  // Load properties file
  FilesManager.loadProperties();

  await ConfigManager.loadConfig();
  const preferredPort = ConfigManager.getPort();

  const PORT_RANGE_START = 34200;
  const PORT_RANGE_END = 34300;

  // Search first the default port
  const availablePort =
    (await findAvailablePort(preferredPort, PORT_RANGE_END)) ??
    (await findAvailablePort(PORT_RANGE_START, PORT_RANGE_END));

  if (availablePort === null) {
    console.error(
      "No port available in the specified range. The application will close."
    );
    app.quit();
    return;
  }

  // Saves the new port if it's different from the default one
  if (availablePort !== preferredPort) {
    ConfigManager.setPort(availablePort);
    await ConfigManager.saveConfig();
  }

  // Initialize MoveDB Connection
  await MovieDBWrapper.initConnection();

  // Add all routes
  addServerRoutes();

  // Start the server
  await startServer(availablePort);

  // Create Tray icon
  createTray();

  if (!authToken || !serverId) {
    // If not authenticated, start the login process.
    await loginAndRegisterServer(availablePort);
    // After the first login, the server will be HTTP. We restart it to apply the new certs.
    if (sslCert && sslKey) {
      console.log(
        "[Bootstrap]: Restarting server to apply new SSL certificate..."
      );
      await restartServer(availablePort);
    }
  } else {
    // If we are logged in, perform a sanity check on the DNS.
    // await verifyAndFixDns();

    // If we don't have a cert, fetch it now.
    if (!sslCert || !sslKey) {
      console.log(
        "[Bootstrap]: Logged in but no local certificate found. Fetching now..."
      );
      const success = await fetchAndSaveSslCertificate();
      if (success) {
        await restartServer(availablePort);
      }
    }
  }

  // After all network setup, manage the hosts file for seamless local access.
  await manageHostsFile();

  // Flush DNS cache
  await flushDnsCache();

  startPublicIpMonitor();

  app.on("activate", () => {
    if (!tray) createTray();
  });
});

// Add a listener to clean up the hosts file before the app quits.
app.on("before-quit", async (event) => {
  event.preventDefault(); // We're doing async work, so we must prevent the app from quitting immediately.
  await cleanupHostsFile();
  await flushDnsCache();
  app.quit(); // Now we can quit.
});

// Avoid quitting the app when all windows are closed for macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
