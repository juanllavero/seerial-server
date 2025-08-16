import net from "net";

/**
 * Checks if a port is available.
 * @param port - the port to check
 * @returns Promise<boolean> - returns true if the port is available and false otherwise
 */
function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (err: any) => {
      // If it reaches here, the port is already in use
      if (err.code === "EADDRINUSE") {
        resolve(false);
      }
    });

    server.once("listening", () => {
      // If it reaches here, the port is available
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
}

/**
 * Searches for an available port within a specified range.
 * @param startPort - initital port
 * @param endPort - final port
 * @returns Promise<number | null> - available port or null
 */
export async function findAvailablePort(
  startPort: number,
  endPort: number
): Promise<number | null> {
  // Try the first port
  let isAvailable = await checkPort(startPort);
  if (isAvailable) {
    return startPort;
  }

  console.warn(
    `[Port Finder] Port ${startPort} is not available. Checking ${
      startPort + 1
    }-${endPort}...`
  );

  // Check the rest of the ports
  for (let port = startPort + 1; port <= endPort; port++) {
    isAvailable = await checkPort(port);
    if (isAvailable) {
      console.log(`[Port Finder] Available port found: ${port}`);
      return port;
    }
  }

  console.error(
    `[Port Finder] No available ports found in the range ${startPort}-${endPort}.`
  );
  return null;
}
