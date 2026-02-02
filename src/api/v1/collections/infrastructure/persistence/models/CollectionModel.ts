import { AlbumModel } from "@/api/v1/albums/infrastructure/persistence/models/AlbumModel";
import { LibraryModel } from "@/api/v1/libraries/infrastructure/persistence/models/LibraryModel";
import { MovieModel } from "@/api/v1/movies/infrastructure/persistence/models/MovieModel";
import { SeriesModel } from "@/api/v1/series/infrastructure/persistence/models/SeriesModel";
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
  PrimaryColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";

const collectionLogger = logger.child({ category: "Collection" });

@Entity({ name: "Collection" })
export class CollectionModel extends BaseEntity {
  @PrimaryColumn({ type: "varchar", nullable: false })
  id!: string;

  @Column({ type: "varchar", nullable: false })
  title!: string;

  @Column({ type: "text", nullable: true, default: "" })
  description?: string;

  @Column({ type: "varchar", nullable: true, default: "", name: "poster_src" })
  posterSrc!: string;

  @Column({
    type: "simple-json",
    nullable: false,
    default: "[]",
    name: "posters_urls",
  })
  postersUrls!: string[];

  @Column({
    type: "varchar",
    nullable: true,
    default: "",
    name: "music_poster_src",
  })
  musicPosterSrc!: string;

  @Column({
    type: "simple-json",
    nullable: false,
    default: "[]",
    name: "music_posters_urls",
  })
  musicPostersUrls!: string[];

  @Column({
    type: "varchar",
    nullable: false,
    default: "",
    name: "background_src",
  })
  backgroundSrc!: string;

  @Column({
    type: "simple-json",
    nullable: false,
    default: "[]",
    name: "background_urls",
  })
  backgroundsUrls!: string[];

  @ManyToMany(() => LibraryModel, (library) => library.collections)
  @JoinTable({
    name: "LibraryCollection",
    joinColumn: { name: "collectionId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "libraryId", referencedColumnName: "id" },
  })
  libraries!: LibraryModel[];

  @ManyToMany(() => MovieModel, (movie) => movie.collections)
  @JoinTable({
    name: "CollectionMovie",
    joinColumn: { name: "collectionId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "movieId", referencedColumnName: "id" },
  })
  movies!: MovieModel[];

  @ManyToMany(() => SeriesModel, (series) => series.collections)
  @JoinTable({
    name: "CollectionSeries",
    joinColumn: { name: "collectionId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "seriesId", referencedColumnName: "id" },
  })
  shows!: SeriesModel[];

  @ManyToMany(() => AlbumModel, (album) => album.collections)
  @JoinTable({
    name: "CollectionAlbum",
    joinColumn: { name: "collectionId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "albumId", referencedColumnName: "id" },
  })
  albums!: AlbumModel[];

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
      await fs.remove(
        path.join("resources", "img", "backgrounds", this.id ?? "")
      );
      collectionLogger.info(`Cleaned data from collection ID=${this.id}`);
    } catch (error) {
      collectionLogger.error(
        error,
        `Error cleaning data for collection ID=${this.id}`
      );
    }
  }
}
