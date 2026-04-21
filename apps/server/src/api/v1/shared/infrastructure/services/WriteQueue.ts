/**
 * WriteQueue - Serializes database write operations to prevent SQLite concurrency issues.
 *
 * SQLite (even with better-sqlite3 and WAL mode) only supports a single writer at a time.
 * This queue ensures all write operations are executed sequentially, preventing
 * SQLITE_BUSY and SQLITE_LOCKED errors while allowing concurrent reads.
 *
 * @example
 * ```typescript
 * const queue = new WriteQueue();
 *
 * // All writes are serialized
 * await queue.enqueue(() => repository.save(entity));
 * await queue.enqueue(() => repository.update(id, data));
 * ```
 */
export class WriteQueue {
  /**
   * Internal promise chain representing the current queue state.
   * Each enqueued operation is chained to this promise to ensure sequential execution.
   */
  private queue: Promise<void> = Promise.resolve();

  /**
   * Enqueues a write operation to be executed sequentially.
   *
   * Operations are guaranteed to execute in the order they are enqueued.
   * If an operation fails, it won't break the queue - subsequent operations will still execute.
   *
   * @template T - The return type of the operation
   * @param operation - Async function containing the database write operation(s)
   * @returns Promise that resolves with the operation's result or rejects with its error
   *
   * @example
   */
  async enqueue<T>(operation: () => Promise<T>): Promise<T> {
    // Create a new promise that waits for the current queue, then executes the operation
    const resultPromise = this.queue
      .then(() => operation())
      .catch((error) => {
        // Re-throw to allow caller to handle the error
        throw error;
      });

    // Update queue to point to this operation (ignoring its result to prevent chain breaking)
    // If this operation fails, the next one will still execute
    this.queue = resultPromise.then(
      () => {}, // Success: ignore result
      () => {}, // Error: swallow error
    );

    return resultPromise;
  }

  /**
   * Returns the number of pending operations in the queue.
   * Useful for monitoring queue depth and debugging.
   *
   * Note: This is an approximation based on promise settling.
   */
  async getPendingCount(): Promise<number> {
    let count = 0;
    let current = this.queue;

    while (current !== Promise.resolve()) {
      count++;
      current = current.catch(() => {});
    }

    return count;
  }

  /**
   * Waits for all currently enqueued operations to complete.
   * Does not prevent new operations from being enqueued.
   *
   * Useful for ensuring all writes are flushed before shutdown.
   */
  async drain(): Promise<void> {
    await this.queue.catch(() => {
      // Ignore errors, just wait for completion
    });
  }
}
