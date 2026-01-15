import { User } from "../../domain/User";
import { UsersRepositoryPort } from "../ports/UsersRepositoryPort";

export class GetAllUsersUseCase {
  constructor(private usersRepo: UsersRepositoryPort) {}

  async execute(): Promise<User[]> {
    return await this.usersRepo.findAll();
  }
}
