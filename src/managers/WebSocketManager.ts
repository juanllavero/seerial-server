import { Collection, Series, Movie, Album } from "@/api/v0/index.models";
import http from "http";
import https from "https";
import WebSocket, { WebSocketServer } from "ws";

interface Client {
  id: string;
  socket: WebSocket;
}

export class WebSocketManager {
  private static instance: WebSocketManager; // Singleton
  private wss: WebSocketServer;
  private clients: Map<string, Client> = new Map();

  // Constructor that receives the HTTP server
  private constructor(server: http.Server) {
    // Initialize WebSocketServer without specific port
    this.wss = new WebSocketServer({ noServer: true });

    // Handle WebSocket connection when HTTP server detects an upgrade
    server.on("upgrade", (req, socket, head) => {
      this.wss.handleUpgrade(req, socket, head, (ws) => {
        this.wss.emit("connection", ws, req);
      });
    });

    console.log(
      `[WebSocket Manager]: server running using the same HTTP/HTTPS server`
    );

    // Handle new WebSocket connections
    this.wss.on("connection", (ws: WebSocket) => {
      // Generate a unique ID for each client
      const clientId = this.generateUniqueId();

      // Create the client and add it to the list of clients
      const client: Client = { id: clientId, socket: ws };
      this.clients.set(clientId, client);

      console.log(`[WebSocket Manager]: Client connected: ${clientId}`);

      // Handle messages received from the client
      ws.on("message", (data: string) => {
        this.broadcast(
          JSON.stringify({ from: clientId, message: data }),
          clientId
        );
      });

      // Handle client disconnection
      ws.on("close", () => {
        console.log(`[WebSocket Manager]: Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });
    });
  }

  // Static method to get the single instance
  public static getInstance(
    server?: http.Server | https.Server
  ): WebSocketManager {
    if (!WebSocketManager.instance && server) {
      WebSocketManager.instance = new WebSocketManager(server);
    }

    return WebSocketManager.instance;
  }

  // Method to send a message to all clients, except the sender
  public broadcast(message: string, senderId?: string): void {
    this.clients.forEach((client, clientId) => {
      if (clientId !== senderId) {
        client.socket.send(message);
      }
    });
  }

  // Method to send a message to a specific client
  public sendMessageToClient(clientId: string, message: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.socket.send(message);
    } else {
      console.error(
        `[WebSocket Manager]: Client with ID ${clientId} not found.`
      );
    }
  }

  // Method to generate a unique ID for each client
  private generateUniqueId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  //#region WEBSOCKET CONTENT MESSAGES
  public static mutateLibraries = (ws: WebSocketManager) => {
    const message = {
      header: "MUTATE_LIBRARIES",
      body: {},
    };
    ws.broadcast(JSON.stringify(message));
  };

  public static mutateLibrary = (ws: WebSocketManager, libraryId: string) => {
    const message = {
      header: "MUTATE_LIBRARY",
      body: {
        libraryId,
      },
    };
    ws.broadcast(JSON.stringify(message));
  };

  public static mutateCollection = (
    ws: WebSocketManager,
    collection: Collection
  ) => {
    const message = {
      header: "MUTATE_COLLECTION",
      body: collection,
    };
    ws.broadcast(JSON.stringify(message));
  };

  public static mutateSeries = (ws: WebSocketManager, series: Series) => {
    const message = {
      header: "MUTATE_SERIES",
      body: series,
    };
    ws.broadcast(JSON.stringify(message));
  };

  public static mutateSeason = (ws: WebSocketManager) => {
    const message = {
      header: "MUTATE_SEASON",
      body: {},
    };
    ws.broadcast(JSON.stringify(message));
  };

  public static mutateEpisode = (ws: WebSocketManager) => {
    const message = {
      header: "MUTATE_EPISODE",
      body: {},
    };
    ws.broadcast(JSON.stringify(message));
  };

  public static mutateMovie = (ws: WebSocketManager, movie: Movie) => {
    const message = {
      header: "MUTATE_MOVIE",
      body: movie,
    };
    ws.broadcast(JSON.stringify(message));
  };

  public static mutateAlbum = (ws: WebSocketManager, album: Album) => {
    const message = {
      header: "MUTATE_ALBUM",
      body: album,
    };
    ws.broadcast(JSON.stringify(message));
  };
  //#endregion
}
