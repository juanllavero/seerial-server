import type { User } from '../../domain/User';
import type { UsersRepositoryPort } from '../ports/UsersRepositoryPort';

export class CreateUserUseCase {
  constructor(private usersRepo: UsersRepositoryPort) {}

  async execute(data: Partial<User>): Promise<User> {
    return this.usersRepo.create(data);
  }
}
