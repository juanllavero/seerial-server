import { User } from "../../domain/User";
import { UsersRepositoryPort } from "../ports/UsersRepositoryPort";

export class AuthenticateUserUseCase {
  constructor(private usersRepo: UsersRepositoryPort) {}

  async execute(
    username: string,
    password: string | null
  ): Promise<{ token: string; user: User | null } | null> {
    return this.usersRepo.authenticate(username, password);
  }
}
