import { LibraryModel } from "@/api/v0/libraries/infrastructure/persistence/models/LibraryModel";
import { ServerModel } from "@/api/v0/servers/infrastructure/persistence/models/ServerModel";
import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  IsIn,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { UserLibraryModel } from "./UserLibraryModel";

@Table({ tableName: "User", timestamps: false })
export class UserModel extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => require("uuid").v4().split("-")[0],
    allowNull: false,
  })
  id!: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  username!: string;

  @Column({ type: DataType.STRING, allowNull: true }) // Store hashed password
  password?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  avatar?: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: "allow_remote",
  })
  allowRemote!: boolean;

  @IsIn([["admin", "normal"]])
  @Column({ type: DataType.STRING, allowNull: false, defaultValue: "normal" })
  type!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: "allow_video_transcoding",
  })
  allowVideoTranscoding!: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: "internet_bitrate_limit",
  }) // In Mbps
  internetBitrateLimit?: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: "allow_downloads",
  })
  allowDownloads!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: "hide_in_login",
  })
  hideInLogin!: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: "max_sessions",
  }) // 0 for unlimited
  maxSessions!: number;

  // Associations
  @ForeignKey(() => ServerModel)
  @Column({ type: DataType.STRING, allowNull: false, field: "server_id" })
  serverId!: string;

  @BelongsTo(() => ServerModel)
  server!: ServerModel;

  @BelongsToMany(() => LibraryModel, {
    through: () => UserLibraryModel,
    hooks: true,
  })
  libraries!: LibraryModel[];
}
