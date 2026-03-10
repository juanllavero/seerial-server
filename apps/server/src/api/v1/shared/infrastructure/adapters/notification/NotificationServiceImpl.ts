import type http from 'node:http';
import type WebSocket from 'ws';
import { WebSocketServer } from 'ws';
import type { Album } from '@/api/v1/albums/domain/Album';
import type { Collection } from '@/api/v1/collections/domain/Collection';
import type { Movie } from '@/api/v1/movies/domain/Movie';
import type { Series } from '@/api/v1/series/domain/Series';
import logger from '@/utils/logger';
import type { NotificationServicePort } from '../../../application/ports/NotificationServicePort';

const notificationLogger = logger.child({ category: 'Notification Service' });

interface Client {
  id: string;
  socket: WebSocket;
}

/**
 * WebSocket implementation of the NotificationServicePort.
 * This adapter handles real-time notifications to clients using WebSocket protocol.
 */
export class NotificationServiceImpl implements NotificationServicePort {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Client> = new Map();

  /**
   * Initialize the WebSocket server
   * @param server - The HTTP server instance to attach WebSocket to
   */
  public init(server: http.Server): void {
    // Initialize WebSocketServer without specific port
    this.wss = new WebSocketServer({ noServer: true });

    // Handle WebSocket connection when HTTP server detects an upgrade
    server.on('upgrade', (req, socket, head) => {
      this.wss!.handleUpgrade(req, socket, head, (ws) => {
        this.wss!.emit('connection', ws, req);
      });
    });

    notificationLogger.info('WebSocket server running using the same HTTP/HTTPS server');

    // Handle new WebSocket connections
    this.wss.on('connection', (ws: WebSocket) => {
      // Generate a unique ID for each client
      const clientId = this.generateUniqueId();

      // Create the client and add it to the list of clients
      const client: Client = { id: clientId, socket: ws };
      this.clients.set(clientId, client);

      notificationLogger.info(`Client connected: ${clientId}`);

      // Handle messages received from the client
      ws.on('message', (data: string) => {
        this.broadcast(JSON.stringify({ from: clientId, message: data }), clientId);
      });

      // Handle client disconnection
      ws.on('close', () => {
        notificationLogger.info(`Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });
    });
  }

  /**
   * Broadcast a message to all connected clients except the sender
   * @param message - The message to broadcast
   * @param senderId - Optional ID of the sender to exclude from broadcast
   */
  public broadcast(message: string, senderId?: string): void {
    this.clients.forEach((client, clientId) => {
      if (clientId !== senderId) {
        client.socket.send(message);
      }
    });
  }

  /**
   * Send a message to a specific client
   * @param clientId - The ID of the client to send the message to
   * @param message - The message to send
   */
  public sendMessageToClient(clientId: string, message: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.socket.send(message);
    } else {
      notificationLogger.error(`Client with ID ${clientId} not found.`);
    }
  }

  /**
   * Generate a unique ID for each client
   * @returns A unique client ID
   */
  private generateUniqueId(): string {
    return Math.random()
      .toString(36)
      .slice(2, 2 + 9);
  }

  //#region NOTIFICATION METHODS FOR CONTENT UPDATES

  /**
   * Notify clients that the libraries list has been updated
   */
  public mutateLibraries(): void {
    const message = {
      header: 'MUTATE_LIBRARIES',
      body: {},
    };
    this.broadcast(JSON.stringify(message));
  }

  /**
   * Notify clients that a specific library has been updated
   * @param libraryId - The ID of the library that was updated
   */
  public mutateLibrary(libraryId: string): void {
    const message = {
      header: 'MUTATE_LIBRARY',
      body: {
        libraryId,
      },
    };
    this.broadcast(JSON.stringify(message));
  }

  /**
   * Notify clients that a collection has been updated
   * @param collection - The updated collection
   */
  public mutateCollection(collection: Collection): void {
    const message = {
      header: 'MUTATE_COLLECTION',
      body: collection,
    };
    this.broadcast(JSON.stringify(message));
  }

  /**
   * Notify clients that a series has been updated
   * @param series - The updated series
   */
  public mutateSeries(series: Series): void {
    const message = {
      header: 'MUTATE_SERIES',
      body: series,
    };
    this.broadcast(JSON.stringify(message));
  }

  /**
   * Notify clients that a season has been updated
   */
  public mutateSeason(): void {
    const message = {
      header: 'MUTATE_SEASON',
      body: {},
    };
    this.broadcast(JSON.stringify(message));
  }

  /**
   * Notify clients that an episode has been updated
   */
  public mutateEpisode(): void {
    const message = {
      header: 'MUTATE_EPISODE',
      body: {},
    };
    this.broadcast(JSON.stringify(message));
  }

  /**
   * Notify clients that a movie has been updated
   * @param movie - The updated movie
   */
  public mutateMovie(movie: Movie): void {
    const message = {
      header: 'MUTATE_MOVIE',
      body: movie,
    };
    this.broadcast(JSON.stringify(message));
  }

  /**
   * Notify clients that an album has been updated
   * @param album - The updated album
   */
  public mutateAlbum(album: Album): void {
    const message = {
      header: 'MUTATE_ALBUM',
      body: album,
    };
    this.broadcast(JSON.stringify(message));
  }

  //#endregion
}
