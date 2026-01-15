import { PlayList } from "../../domain/PlayList";
import { PlayListRepositoryPort } from "../ports/PlayListRepositoryPort";

export class FindPlayListByIdUseCase {
  constructor(private playlistRepo: PlayListRepositoryPort) {}

  async execute(id: string): Promise<PlayList | null> {
    return this.playlistRepo.findById(id);
  }
}
