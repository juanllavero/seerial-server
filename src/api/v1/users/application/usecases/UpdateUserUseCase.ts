import { User } from "../../domain/User";
import { UsersRepositoryPort } from "../ports/UsersRepositoryPort";

export class UpdateUserUseCase {
  constructor(private usersRepo: UsersRepositoryPort) {}

  async execute(id: string, data: Partial<User>): Promise<User> {
    return this.usersRepo.update(id, data);
  }
}
