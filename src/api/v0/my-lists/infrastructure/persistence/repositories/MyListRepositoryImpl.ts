import { BaseRepository } from "@/api/v0/base-repository/BaseRepository";
import { MyListRepositoryPort } from "../../../application/ports/MyListRepositoryPort";

export class MyListRepositoryImpl
  extends BaseRepository
  implements MyListRepositoryPort {}
