import { Library } from "@/api/v0/index.models";
import {
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { User } from "./users.model";

@Table({ tableName: "UserLibrary", timestamps: false })
export class UserLibrary extends Model {
  @PrimaryKey
  @ForeignKey(() => User)
  @Column({ type: DataType.STRING, allowNull: false, field: "user_id" })
  userId!: string;

  @PrimaryKey
  @ForeignKey(() => Library)
  @Column({ type: DataType.STRING, allowNull: false, field: "library_id" })
  libraryId!: string;
}
