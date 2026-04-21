const mockNotificationLoggerError = jest.fn();
const mockNotificationLoggerInfo = jest.fn();

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: {
    child: jest.fn(() => ({
      error: mockNotificationLoggerError,
      info: mockNotificationLoggerInfo,
    })),
  },
}));

import { NotificationServiceImpl } from '@/api/v1/shared/infrastructure/adapters/notification/NotificationServiceImpl';

describe('NotificationServiceImpl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('broadcast skips the sender and sends the payload to the remaining clients', () => {
    const service = new NotificationServiceImpl();
    const senderSocket = { send: jest.fn() };
    const recipientSocket = { send: jest.fn() };

    (
      service as unknown as {
        clients: Map<string, { id: string; socket: { send: (message: string) => void } }>;
      }
    ).clients = new Map([
      ['sender', { id: 'sender', socket: senderSocket }],
      ['recipient', { id: 'recipient', socket: recipientSocket }],
    ]);

    service.broadcast('payload', 'sender');

    expect(senderSocket.send).not.toHaveBeenCalled();
    expect(recipientSocket.send).toHaveBeenCalledWith('payload');
  });

  it('logs an error when sending to an unknown client', () => {
    const service = new NotificationServiceImpl();

    service.sendMessageToClient('missing-client', 'payload');

    expect(mockNotificationLoggerError).toHaveBeenCalledWith(
      'Client with ID missing-client not found.',
    );
  });

  it.each([
    ['mutateCollection', { id: 'collection-1' }, 'MUTATE_COLLECTION'],
    ['mutateSeason', undefined, 'MUTATE_SEASON'],
    ['mutateEpisode', undefined, 'MUTATE_EPISODE'],
    ['mutateMovie', { id: 'movie-1' }, 'MUTATE_MOVIE'],
    ['mutateAlbum', { id: 'album-1' }, 'MUTATE_ALBUM'],
  ] as const)('broadcasts the expected payload for %s', (method, payload, header) => {
    const service = new NotificationServiceImpl();
    const broadcastSpy = jest.spyOn(service, 'broadcast').mockImplementation(() => undefined);

    if (payload === undefined) {
      (service[method] as () => void)();
    } else {
      (service[method] as (value: unknown) => void)(payload);
    }

    expect(broadcastSpy).toHaveBeenCalledWith(
      JSON.stringify({
        header,
        body: payload ?? {},
      }),
    );
  });
});
