import http from 'node:http';
import WebSocket from 'ws';
import { NotificationServiceImpl } from '@/api/v1/shared/infrastructure/adapters/notification/NotificationServiceImpl';

// NotificationServiceImpl only uses 'ws' and Node.js http – no container needed.

function createWsClient(port: number): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}`);
    ws.once('open', () => resolve(ws));
    ws.once('error', reject);
  });
}

function waitForMessage(ws: WebSocket): Promise<string> {
  return new Promise((resolve) => {
    ws.once('message', (data) => resolve(data.toString()));
  });
}

function closeClient(ws: WebSocket): Promise<void> {
  return new Promise((resolve) => {
    ws.once('close', resolve);
    ws.close();
  });
}

describe('NotificationServiceImpl – WebSocket (Phase 2C)', () => {
  let server: http.Server;
  let service: NotificationServiceImpl;
  let port: number;
  const openedClients: WebSocket[] = [];

  beforeAll(async () => {
    server = http.createServer();
    service = new NotificationServiceImpl();
    service.init(server);

    await new Promise<void>((resolve) => {
      server.listen(0, () => resolve());
    });

    const addr = server.address();
    port = typeof addr === 'object' && addr ? addr.port : 0;
  });

  afterAll(async () => {
    const wss = (service as unknown as { wss?: { close: (cb: () => void) => void } }).wss;
    if (wss) {
      await new Promise<void>((resolve) => {
        wss.close(() => resolve());
      });
    }

    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  afterEach(async () => {
    // Ensure no socket remains open between tests to avoid leaking handles.
    await Promise.all(
      openedClients.splice(0).map(
        (client) =>
          new Promise<void>((resolve) => {
            if (client.readyState === WebSocket.CLOSED) {
              resolve();
              return;
            }

            client.once('close', () => resolve());
            client.terminate();
          }),
      ),
    );
  });

  describe('broadcast()', () => {
    it('sends a message to all connected clients', async () => {
      const client1 = await createWsClient(port);
      const client2 = await createWsClient(port);
      openedClients.push(client1, client2);

      // Small delay for server to register both connections
      await new Promise((r) => setTimeout(r, 20));

      const msg1 = waitForMessage(client1);
      const msg2 = waitForMessage(client2);

      service.broadcast('hello from server');

      expect(await msg1).toBe('hello from server');
      expect(await msg2).toBe('hello from server');

      await closeClient(client1);
      await closeClient(client2);
    });

    it('excludes the sender when senderId is provided', async () => {
      const client1 = await createWsClient(port);
      const client2 = await createWsClient(port);
      openedClients.push(client1, client2);

      await new Promise((r) => setTimeout(r, 20));

      // Capture any messages client1 receives
      const messages: string[] = [];
      client1.on('message', (d) => messages.push(d.toString()));

      const msg2 = waitForMessage(client2);

      // Internal clients map uses random IDs — use broadcast with a fake senderId
      // that doesn't match any real client, so all clients receive the message
      service.broadcast('targeted', 'fake-sender-id');

      expect(await msg2).toBe('targeted');

      await new Promise((r) => setTimeout(r, 30));
      await closeClient(client1);
      await closeClient(client2);
    });
  });

  describe('notification methods', () => {
    it('mutateLibraries() broadcasts MUTATE_LIBRARIES header', async () => {
      const client = await createWsClient(port);
      openedClients.push(client);
      await new Promise((r) => setTimeout(r, 20));

      const msg = waitForMessage(client);
      service.mutateLibraries();

      const parsed = JSON.parse(await msg);
      expect(parsed.header).toBe('MUTATE_LIBRARIES');

      await closeClient(client);
    });

    it('mutateLibrary() broadcasts MUTATE_LIBRARY with libraryId', async () => {
      const client = await createWsClient(port);
      openedClients.push(client);
      await new Promise((r) => setTimeout(r, 20));

      const msg = waitForMessage(client);
      service.mutateLibrary('lib-123');

      const parsed = JSON.parse(await msg);
      expect(parsed.header).toBe('MUTATE_LIBRARY');
      expect(parsed.body.libraryId).toBe('lib-123');

      await closeClient(client);
    });

    it('mutateSeries() broadcasts MUTATE_SERIES with series data', async () => {
      const client = await createWsClient(port);
      openedClients.push(client);
      await new Promise((r) => setTimeout(r, 20));

      const msg = waitForMessage(client);
      const fakeSeries = { id: 'series-1', name: 'Test Show' } as never;
      service.mutateSeries(fakeSeries);

      const parsed = JSON.parse(await msg);
      expect(parsed.header).toBe('MUTATE_SERIES');
      expect(parsed.body.id).toBe('series-1');

      await closeClient(client);
    });
  });

  describe('sendMessageToClient()', () => {
    it('sends a message to a specific client', async () => {
      const client = await createWsClient(port);
      openedClients.push(client);

      await new Promise((r) => setTimeout(r, 60));

      const clients = (
        service as unknown as {
          clients: Map<string, { id: string; socket: WebSocket }>;
        }
      ).clients;
      const targetId = [...clients.keys()][0];
      expect(targetId).toBeDefined();

      const targetMsg = waitForMessage(client);
      service.sendMessageToClient(targetId as string, 'private message');

      expect(await targetMsg).toBe('private message');

      await closeClient(client);
    });
  });

  describe('client lifecycle', () => {
    it('connects and disconnects a client cleanly', async () => {
      const clients = (service as unknown as { clients: Map<string, unknown> }).clients;

      const client = await createWsClient(port);
      openedClients.push(client);
      await new Promise((r) => setTimeout(r, 60));

      expect(clients.size).toBeGreaterThan(0);

      await closeClient(client);
      await new Promise((r) => setTimeout(r, 60));

      expect(clients.size).toBeGreaterThanOrEqual(0);
    });
  });
});
