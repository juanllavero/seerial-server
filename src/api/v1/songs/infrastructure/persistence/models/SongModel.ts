import { AlbumModel } from "@/api/v1/albums/infrastructure/persistence/models/AlbumModel";
import { PlayListModel } from "@/api/v1/playlists/infrastructure/persistence/models/PlayListModel";
import {
  BaseEntity,
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";

@Entity({ name: "Song" })
export class SongModel extends BaseEntity {
  @PrimaryColumn({ type: "varchar", nullable: false })
  id!: string;

  @Column({ type: "varchar", nullable: false, name: "file_src" })
  fileSrc!: string;

  @Column({ type: "varchar", nullable: false, name: "album_id" })
  albumId!: string;

  @Column({ type: "varchar", nullable: false, default: "" })
  title!: string;

  @Column({ type: "integer", nullable: false, default: 0 })
  duration!: number;

  @Column({
    type: "integer",
    nullable: false,
    default: 0,
    name: "track_number",
  })
  trackNumber!: number;

  @Column({ type: "integer", nullable: false, default: 0, name: "disc_number" })
  discNumber!: number;

  @Column({ type: "boolean", nullable: true, name: "has_dolby_atmos" })
  hasDolbyAtmos!: boolean;

  @Column({ type: "varchar", nullable: false, default: "" })
  codec!: string;

  @Column({ type: "simple-json", nullable: false, default: "[]" })
  composers!: string[];

  @Column({ type: "simple-json", nullable: false, default: "[]" })
  artists!: string[];

  @ManyToOne(() => AlbumModel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "album_id" })
  album!: AlbumModel;

  @ManyToMany(() => PlayListModel, (playList) => playList.songs)
  @JoinTable({
    name: "PlayListItem",
    joinColumn: { name: "songId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "playListId", referencedColumnName: "id" },
  })
  playLists!: PlayListModel[];

  // Lifecycle hooks
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4().split("-")[0];
    }
  }
}
[];
