import { UpdatePlayListDTO } from "../../application/dtos/PlayListDTOs";
import { PlayList } from "../../domain/PlayList";
import { PlayListRepositoryPort } from "../ports/PlayListRepositoryPort";

export class UpdatePlayListUseCase {
  constructor(private playlistRepo: PlayListRepositoryPort) {}

  async execute(id: string, data: UpdatePlayListDTO): Promise<PlayList> {
    return this.playlistRepo.update(id, data);
  }
}
