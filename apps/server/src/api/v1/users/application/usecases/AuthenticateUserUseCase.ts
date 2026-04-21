import type { User } from '../../domain/User';
import type { UsersRepositoryPort } from '../ports/UsersRepositoryPort';

export class AuthenticateUserUseCase {
  constructor(private usersRepo: UsersRepositoryPort) {}

  async execute(
    username: string,
    password: string | null,
  ): Promise<{ token: string; user: User | null } | null> {
    return this.usersRepo.authenticate(username, password);
  }
}
