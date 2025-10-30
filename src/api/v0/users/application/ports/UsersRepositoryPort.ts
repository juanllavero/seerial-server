import { User } from "../../domain/User";

export interface UsersRepositoryPort {
  findAll(): Promise<User[]>;
  authenticate(
    username: string,
    password: string | null
  ): Promise<{ token: string; user: User | null } | null>;
  create(data: Partial<User>): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
}
