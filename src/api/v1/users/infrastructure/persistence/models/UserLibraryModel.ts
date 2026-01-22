import { LibraryModel } from "@/api/v1/libraries/infrastructure/persistence/models/LibraryModel";
import {
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { UserModel } from "./UserModel";

@Table({ tableName: "UserLibrary", timestamps: false })
export class UserLibraryModel extends Model {
  @PrimaryKey
  @ForeignKey(() => UserModel)
  @Column({ type: DataType.STRING, allowNull: false, field: "user_id" })
  userId!: string;

  @PrimaryKey
  @ForeignKey(() => LibraryModel)
  @Column({ type: DataType.STRING, allowNull: false, field: "library_id" })
  libraryId!: string;
}
