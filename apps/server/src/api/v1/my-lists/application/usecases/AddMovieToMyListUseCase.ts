import type { MyListItem } from '../../domain/MyList';
import type { MyListRepositoryPort } from '../ports/MyListRepositoryPort';

export class AddMovieToMyListUseCase {
  constructor(private myListRepo: MyListRepositoryPort) {}

  async execute(movieId: string, userId: string): Promise<MyListItem | null> {
    return await this.myListRepo.addMovieToMyList(movieId, userId);
  }
}
