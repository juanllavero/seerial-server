import { SongModel } from "@/api/v1/songs/infrastructure/persistence/models/SongModel";
import {
  BaseEntity,
  BeforeInsert,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";

@Entity({ name: "PlayList" })
export class PlayListModel extends BaseEntity {
  @PrimaryColumn({ type: "varchar", nullable: false })
  id!: string;

  @Column({ type: "varchar", nullable: false, name: "user_id" })
  userId!: string;

  @Column({ type: "varchar", nullable: false })
  title!: string;

  @Column({ type: "varchar", nullable: true, default: "" })
  description?: string;

  @ManyToMany(() => SongModel, (song) => song.playLists)
  @JoinTable({
    name: "PlayListItem",
    joinColumn: { name: "playListId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "songId", referencedColumnName: "id" },
  })
  songs!: SongModel[];

  // Lifecycle hooks
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4().split("-")[0];
    }
  }
}
