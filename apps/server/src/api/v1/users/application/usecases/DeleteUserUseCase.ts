import type { UsersRepositoryPort } from "../ports/UsersRepositoryPort";

export class DeleteUserUseCase {
	constructor(private usersRepo: UsersRepositoryPort) {}

	async execute(id: string): Promise<void> {
		return this.usersRepo.delete(id);
	}
}
