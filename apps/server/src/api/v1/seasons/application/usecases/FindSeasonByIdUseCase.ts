import type { IncludeType } from "@/types/common";
import type { Season } from "../../domain/Season";
import type { SeasonsRepositoryPort } from "../ports/SeasonsRepositoryPort";

export class FindSeasonByIdUseCase {
	constructor(private seasonRepo: SeasonsRepositoryPort) {}

	async execute(id: string, include?: IncludeType): Promise<Season | null> {
		return this.seasonRepo.findById(id, include);
	}
}
