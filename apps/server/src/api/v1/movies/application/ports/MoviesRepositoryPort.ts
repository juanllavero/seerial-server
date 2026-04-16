import type { Movie } from "../../domain/Movie";

export interface MoviesRepositoryPort {
	findAll(libraryId: string): Promise<Movie[]>;
	findById(id: string): Promise<Movie | null>;
	findByPath(videoSrc: string): Promise<Movie | null>;
	create(movie: Partial<Movie>): Promise<Movie>;
	update(id: string, album: Partial<Movie>): Promise<Movie>;
	delete(id: string): Promise<void>;
}
