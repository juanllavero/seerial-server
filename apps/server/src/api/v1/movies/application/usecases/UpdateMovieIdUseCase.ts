import { changeIdentificationMovie } from "@/api/v1/shared/infrastructure/services/FileSearchService";

export class UpdateMovieIdUseCase {
  constructor() {}

  async execute(id: string, themdbId: number): Promise<void> {
    changeIdentificationMovie(id, themdbId);
  }
}
