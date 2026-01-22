import { changeIdentificationMovie } from "@/file-search/utils/changeIdentification";

export class UpdateMovieIdUseCase {
  constructor() {}

  async execute(id: string, themdbId: number): Promise<void> {
    changeIdentificationMovie(id, themdbId);
  }
}
