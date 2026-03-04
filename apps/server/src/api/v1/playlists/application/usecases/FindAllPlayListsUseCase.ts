import { PlayList } from "../../domain/PlayList";
import { PlayListRepositoryPort } from "../ports/PlayListRepositoryPort";

export class FindAllPlayListsUseCase {
  constructor(private playlistRepo: PlayListRepositoryPort) {}

  async execute(): Promise<PlayList[]> {
    return this.playlistRepo.findAll();
  }
}
