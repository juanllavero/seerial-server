import { LibraryModel } from "@/api/v1/libraries/infrastructure/persistence/models/LibraryModel";
import { ServerModel } from "@/api/v1/servers/infrastructure/persistence/models/ServerModel";
import {
  BaseEntity,
  BeforeInsert,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";

@Entity({ name: "User" })
export class UserModel extends BaseEntity {
  @PrimaryColumn({ type: "varchar", nullable: false })
  id!: string;

  @Column({ type: "varchar", nullable: false, unique: true })
  username!: string;

  @Column({ type: "varchar", nullable: true }) // Store hashed password
  password?: string;

  @Column({ type: "varchar", nullable: true })
  avatar?: string;

  @Column({
    type: "boolean",
    nullable: false,
    default: true,
    name: "allow_remote",
  })
  allowRemote!: boolean;

  @Column({ type: "varchar", nullable: false, default: "normal" })
  type!: string;

  @Column({
    type: "boolean",
    nullable: false,
    default: true,
    name: "allow_video_transcoding",
  })
  allowVideoTranscoding!: boolean;

  @Column({ type: "integer", nullable: true, name: "internet_bitrate_limit" }) // In Mbps
  internetBitrateLimit?: number;

  @Column({
    type: "boolean",
    nullable: false,
    default: true,
    name: "allow_downloads",
  })
  allowDownloads!: boolean;

  @Column({
    type: "boolean",
    nullable: false,
    default: false,
    name: "hide_in_login",
  })
  hideInLogin!: boolean;

  @Column({
    type: "integer",
    nullable: false,
    default: 0,
    name: "max_sessions",
  }) // 0 for unlimited
  maxSessions!: number;

  @Column({ type: "varchar", nullable: false, name: "server_id" })
  serverId!: string;

  @ManyToOne(() => ServerModel, { onDelete: "CASCADE" })
  server!: ServerModel;

  @ManyToMany(() => LibraryModel, (library) => library.users)
  @JoinTable({
    name: "UserLibrary",
    joinColumn: { name: "userId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "libraryId", referencedColumnName: "id" },
  })
  libraries!: LibraryModel[];

  // Lifecycle hooks
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4().split("-")[0];
    }
  }
}
