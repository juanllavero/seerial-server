import type { Library } from "../../domain/Library";
import type { LibrariesRepositoryPort } from "../ports/LibrariesRepositoryPort";

export class GetLibraryUseCase {
	constructor(private librariesRepo: LibrariesRepositoryPort) {}

	async execute(id: string): Promise<Library | null> {
		return await this.librariesRepo.getById(id);
	}
}
