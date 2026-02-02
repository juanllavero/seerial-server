import { ArtistModel } from "@/api/v1/artists/infrastructure/persistence/models/ArtistModel";
import { CollectionModel } from "@/api/v1/collections/infrastructure/persistence/models/CollectionModel";
import { LibraryModel } from "@/api/v1/libraries/infrastructure/persistence/models/LibraryModel";
import { SongModel } from "@/api/v1/songs/infrastructure/persistence/models/SongModel";
import logger from "@/utils/logger";
import fs from "fs-extra";
import path from "path";
import {
  BaseEntity,
  BeforeInsert,
  BeforeRemove,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";

const albumLogger = logger.child({ category: "Album" });

@Entity({ name: "Album" })
export class AlbumModel extends BaseEntity {
  @PrimaryColumn({ type: "varchar", nullable: false })
  id!: string;

  @Column({ type: "varchar", nullable: false, name: "library_id" })
  libraryId!: string;

  @Column({ type: "integer", nullable: false, default: 0 })
  order!: number;

  @Column({ type: "varchar", nullable: false, default: "" })
  title!: string;

  @Column({ type: "varchar", nullable: true, default: "" })
  year?: string;

  @Column({ type: "simple-json", nullable: true, default: "[]" })
  genres!: string[];

  @Column({ type: "text", nullable: true, default: "" })
  description?: string;

  @Column({ type: "text", nullable: true, default: "", name: "cover_src" })
  coverSrc!: string;

  @Column({ type: "varchar", nullable: false, default: "" })
  folder!: string;

  @ManyToOne(() => LibraryModel, { onDelete: "CASCADE" })
  library!: LibraryModel;

  @ManyToMany(() => CollectionModel, (collection) => collection.albums)
  @JoinTable({
    name: "CollectionAlbum",
    joinColumn: { name: "albumId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "collectionId", referencedColumnName: "id" },
  })
  collections!: CollectionModel[];

  @ManyToMany(() => ArtistModel, (artist) => artist.albums)
  @JoinTable({
    name: "Album_Artist",
    joinColumn: { name: "albumId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "artistId", referencedColumnName: "id" },
  })
  artists!: ArtistModel[];

  @OneToMany(() => SongModel, (song) => song.album)
  songs!: SongModel[];

  // Lifecycle hooks
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4().split("-")[0];
    }
  }

  @BeforeRemove()
  async beforeRemove(): Promise<void> {
    try {
      await fs.remove(path.join("resources", "img", "posters", this.id ?? ""));
      albumLogger.info(`Cleaned data from album ID=${this.id}`);
    } catch (error) {
      albumLogger.error(error, `Error cleaning data for album ID=${this.id}`);
    }
  }
}
