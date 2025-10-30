import { EpisodeRepositoryPort } from "@/api/v0/episodes/application/ports/EpisodeRepositoryPort";
import { FilesManager } from "@/managers/FilesManager";
import { Season } from "../../domain/Season";
import { SeasonsRepositoryPort } from "../ports/SeasonsRepositoryPort";

export class DeleteSeasonUseCase {
  constructor(
    private seasonsRepo: SeasonsRepositoryPort,
    private episodesRepo: EpisodeRepositoryPort
  ) {}

  async execute(id: string): Promise<void> {
    const season = await this.seasonsRepo.findById(id, "few");
    if (!season) throw new Error(`Season with ID ${id} not found`);

    //  Delete episodes
    for (const episode of season.episodes || []) {
      await this.episodesRepo.delete(episode.id);
    }

    // Delete local media files and folders
    this.deleteLocalMedia(season);

    await this.seasonsRepo.delete(id);
  }

  private deleteLocalMedia(season: Season) {
    FilesManager.deleteDirectory(`resources/img/backgrounds/${season.id}`);
    FilesManager.deleteDirectory(`resources/img/posters/${season.id}`);
    FilesManager.deleteDirectory(`resources/img/logos/${season.id}`);

    if (season.musicSrc) {
      FilesManager.deleteFile(season.musicSrc);
    }
    if (season.videoSrc) {
      FilesManager.deleteFile(season.videoSrc);
    }
  }
}
