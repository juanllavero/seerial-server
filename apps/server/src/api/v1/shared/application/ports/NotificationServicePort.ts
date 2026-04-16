import type http from "node:http";
import type { Album } from "@/api/v1/albums/domain/Album";
import type { Collection } from "@/api/v1/collections/domain/Collection";
import type { Movie } from "@/api/v1/movies/domain/Movie";
import type { Series } from "@/api/v1/series/domain/Series";

/**
 * Port interface for notification service following Ports and Adapters architecture.
 * This abstraction allows different notification mechanisms (WebSocket, SSE, etc.)
 * to be implemented without affecting the application layer.
 */
export interface NotificationServicePort {
	/**
	 * Initialize the notification service with an HTTP server
	 * @param server - The HTTP server instance to attach the notification mechanism to
	 */
	init(server: http.Server): void;

	/**
	 * Broadcast a message to all connected clients except the sender
	 * @param message - The message to broadcast
	 * @param senderId - Optional ID of the sender to exclude from broadcast
	 */
	broadcast(message: string, senderId?: string): void;

	/**
	 * Send a message to a specific client
	 * @param clientId - The ID of the client to send the message to
	 * @param message - The message to send
	 */
	sendMessageToClient(clientId: string, message: string): void;

	/**
	 * Notify clients that the libraries list has been updated
	 */
	mutateLibraries(): void;

	/**
	 * Notify clients that a specific library has been updated
	 * @param libraryId - The ID of the library that was updated
	 */
	mutateLibrary(libraryId: string): void;

	/**
	 * Notify clients that a collection has been updated
	 * @param collection - The updated collection
	 */
	mutateCollection(collection: Collection): void;

	/**
	 * Notify clients that a series has been updated
	 * @param series - The updated series
	 */
	mutateSeries(series: Series): void;

	/**
	 * Notify clients that a season has been updated
	 */
	mutateSeason(): void;

	/**
	 * Notify clients that an episode has been updated
	 */
	mutateEpisode(): void;

	/**
	 * Notify clients that a movie has been updated
	 * @param movie - The updated movie
	 */
	mutateMovie(movie: Movie): void;

	/**
	 * Notify clients that an album has been updated
	 * @param album - The updated album
	 */
	mutateAlbum(album: Album): void;
}
