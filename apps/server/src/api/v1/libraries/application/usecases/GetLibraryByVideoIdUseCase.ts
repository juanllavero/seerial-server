import type { Library } from "../../domain/Library";
import type { LibrariesRepositoryPort } from "../ports/LibrariesRepositoryPort";

export class GetLibraryByVideoIdUseCase {
	constructor(private librariesRepo: LibrariesRepositoryPort) {}

	async execute(id: string): Promise<Library | null> {
		return await this.librariesRepo.getByVideoId(id);
	}
}
