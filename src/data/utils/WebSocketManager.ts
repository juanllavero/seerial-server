import { WebSocketServer } from "ws";
import WebSocket from "ws";
import http from "http";

interface Client {
  id: string;
  socket: WebSocket;
}

export class WebSocketManager {
  private static instance: WebSocketManager; // Singleton
  private wss: WebSocketServer;
  private clients: Map<string, Client> = new Map();

  // Constructor que recibe el servidor HTTP
  private constructor(server: http.Server) {
    // Inicializamos WebSocketServer sin puerto específico
    this.wss = new WebSocketServer({ noServer: true });

    // Asignar la conexión WebSocket cuando el servidor HTTP detecte una actualización (upgrade)
    server.on('upgrade', (req, socket, head) => {
      this.wss.handleUpgrade(req, socket, head, (ws) => {
        this.wss.emit('connection', ws, req);
      });
    });

    console.log(`WebSocket server running using the same HTTP server`);

    // Manejar nuevas conexiones WebSocket
    this.wss.on("connection", (ws: WebSocket) => {
      // Generar un ID único para cada cliente
      const clientId = this.generateUniqueId();

      // Crear el cliente y añadirlo a la lista de clientes
      const client: Client = { id: clientId, socket: ws };
      this.clients.set(clientId, client);

      console.log(`Client connected: ${clientId}`);

      // Manejar mensajes recibidos del cliente
      ws.on("message", (data: string) => {
        console.log(`Received message from client ${clientId}: ${data}`);
        this.broadcast(
          JSON.stringify({ from: clientId, message: data }),
          clientId
        );
      });

      // Manejar la desconexión del cliente
      ws.on("close", () => {
        console.log(`Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });
    });
  }

  // Método estático para obtener la única instancia
  public static getInstance(server?: http.Server): WebSocketManager {
    if (!WebSocketManager.instance && server) {
      WebSocketManager.instance = new WebSocketManager(server);
    }
    
    return WebSocketManager.instance;
  }

  // Método para enviar un mensaje a todos los clientes, excepto al remitente
  public broadcast(message: string, senderId?: string): void {
    this.clients.forEach((client, clientId) => {
      if (clientId !== senderId) {
        client.socket.send(message);
      }
    });
  }

  // Método para enviar un mensaje a un cliente específico
  public sendMessageToClient(clientId: string, message: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.socket.send(message);
    } else {
      console.error(`Client with ID ${clientId} not found.`);
    }
  }

  // Método para generar un ID único para cada cliente
  private generateUniqueId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}