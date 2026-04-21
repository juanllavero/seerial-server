import { WriteQueue } from '@/api/v1/shared/infrastructure/services/WriteQueue';

describe('WriteQueue', () => {
  let queue: WriteQueue;

  beforeEach(() => {
    queue = new WriteQueue();
  });

  describe('enqueue', () => {
    it('executes a single operation and returns its result', async () => {
      const result = await queue.enqueue(async () => 42);
      expect(result).toBe(42);
    });

    it('executes operations in the order they are enqueued', async () => {
      const order: number[] = [];

      await Promise.all([
        queue.enqueue(async () => {
          order.push(1);
        }),
        queue.enqueue(async () => {
          order.push(2);
        }),
        queue.enqueue(async () => {
          order.push(3);
        }),
      ]);

      expect(order).toEqual([1, 2, 3]);
    });

    it('propagates errors to the caller', async () => {
      await expect(
        queue.enqueue(async () => {
          throw new Error('operation failed');
        }),
      ).rejects.toThrow('operation failed');
    });

    it('continues executing subsequent operations after a failure', async () => {
      const results: string[] = [];

      await queue.enqueue(async () => {
        results.push('before');
      });

      await expect(
        queue.enqueue(async () => {
          throw new Error('boom');
        }),
      ).rejects.toThrow();

      await queue.enqueue(async () => {
        results.push('after');
      });

      expect(results).toEqual(['before', 'after']);
    });

    it('handles concurrent enqueues without data races', async () => {
      let counter = 0;

      const increments = Array.from({ length: 20 }, () =>
        queue.enqueue(async () => {
          const current = counter;
          counter = current + 1;
        }),
      );

      await Promise.all(increments);
      expect(counter).toBe(20);
    });
  });

  describe('drain', () => {
    it('resolves after all enqueued operations complete', async () => {
      const results: number[] = [];

      queue.enqueue(async () => {
        results.push(1);
      });
      queue.enqueue(async () => {
        results.push(2);
      });

      await queue.drain();
      expect(results).toEqual([1, 2]);
    });

    it('resolves even when a queued operation fails', async () => {
      // Attach a catch handler to silence the rejection so it doesn't
      // propagate as an unhandled rejection and crash the test worker.
      queue
        .enqueue(async () => {
          throw new Error('silent failure');
        })
        .catch(() => {});

      await expect(queue.drain()).resolves.toBeUndefined();
    });
  });
});
