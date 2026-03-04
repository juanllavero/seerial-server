import { AlbumModel } from "@/api/v1/albums/infrastructure/persistence/models/AlbumModel";
import { PlayListItemModel } from "@/api/v1/playlists/infrastructure/persistence/models/PlayListItemModel";
import {
  BaseEntity,
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";

@Entity({ name: "Song" })
export class SongModel extends BaseEntity {
  @PrimaryColumn({ type: "varchar", nullable: false })
  id!: string;

  @Column({ type: "varchar", nullable: false })
  fileSrc!: string;

  @Column({ type: "varchar", nullable: false })
  albumId!: string;

  @Column({ type: "varchar", nullable: false, default: "" })
  title!: string;

  @Column({ type: "integer", nullable: false, default: 0 })
  duration!: number;

  @Column({
    type: "integer",
    nullable: false,
    default: 0,
  })
  trackNumber!: number;

  @Column({ type: "integer", nullable: false, default: 0 })
  discNumber!: number;

  @Column({ type: "boolean", nullable: true })
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

  @OneToMany(() => PlayListItemModel, (item) => item.song)
  playListItems!: PlayListItemModel[];

  // Lifecycle hooks
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4().split("-")[0];
    }
  }
}
