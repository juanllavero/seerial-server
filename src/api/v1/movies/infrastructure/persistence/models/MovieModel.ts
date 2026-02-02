import { CollectionModel } from "@/api/v1/collections/infrastructure/persistence/models/CollectionModel";
import { LibraryModel } from "@/api/v1/libraries/infrastructure/persistence/models/LibraryModel";
import { VideoModel } from "@/api/v1/videos/infrastructure/persistence/models/VideoModel";
import { WatchListModel } from "@/api/v1/watch-lists/infrastructure/persistence/models/WatchListModel";
import { CastData } from "@/data/interfaces/Media";
import {
  BaseEntity,
  BeforeInsert,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";

@Entity({ name: "Movie" })
export class MovieModel extends BaseEntity {
  @PrimaryColumn({ type: "varchar", nullable: false })
  id!: string;

  @Column({ type: "varchar", nullable: false, name: "library_id" })
  libraryId!: string;

  @Column({ type: "varchar", nullable: false, default: "", name: "imdb_id" })
  imdbId!: string;

  @Column({ type: "integer", nullable: false, default: 0, name: "themdb_id" })
  themdbId!: number;

  @Column({ type: "float", nullable: false, default: 0, name: "imdb_score" })
  imdbScore!: number;

  @Column({ type: "float", nullable: false, default: 0 })
  score!: number;

  @Column({ type: "integer", nullable: false, default: 0 })
  order!: number;

  @Column({ type: "varchar", nullable: false, default: "" })
  name!: string;

  @Column({
    type: "boolean",
    nullable: false,
    default: false,
    name: "name_lock",
  })
  nameLock!: boolean;

  @Column({ type: "text", nullable: false, default: "" })
  overview!: string;

  @Column({
    type: "boolean",
    nullable: false,
    default: false,
    name: "overview_lock",
  })
  overviewLock!: boolean;

  @Column({ type: "varchar", nullable: false, default: "" })
  year!: string;

  @Column({
    type: "boolean",
    nullable: false,
    default: false,
    name: "year_lock",
  })
  yearLock!: boolean;

  @Column({ type: "varchar", nullable: false, default: "", name: "tagline" })
  tagline!: string;

  @Column({
    type: "boolean",
    nullable: false,
    default: false,
    name: "tagline_lock",
  })
  taglineLock!: boolean;

  @Column({ type: "simple-json", nullable: false, default: "[]" })
  genres!: string[];

  @Column({
    type: "boolean",
    nullable: false,
    default: false,
    name: "genres_lock",
  })
  genresLock!: boolean;

  @Column({
    type: "simple-json",
    nullable: false,
    default: "[]",
    name: "production_studios",
  })
  productionStudios!: string[];

  @Column({
    type: "boolean",
    nullable: false,
    default: false,
    name: "production_studios_lock",
  })
  productionStudiosLock!: boolean;

  @Column({
    type: "simple-json",
    nullable: false,
    default: "[]",
    name: "directed_by",
  })
  directedBy!: string[];

  @Column({
    type: "boolean",
    nullable: false,
    default: false,
    name: "directed_by_lock",
  })
  directedByLock!: boolean;

  @Column({
    type: "simple-json",
    nullable: false,
    default: "[]",
    name: "written_by",
  })
  writtenBy!: string[];

  @Column({
    type: "boolean",
    nullable: false,
    default: false,
    name: "written_by_lock",
  })
  writtenByLock!: boolean;

  @Column({ type: "simple-json", nullable: false, default: "[]" })
  creator!: string[];

  @Column({
    type: "boolean",
    nullable: false,
    default: false,
    name: "creator_lock",
  })
  creatorLock!: boolean;

  @Column({
    type: "simple-json",
    nullable: false,
    default: "[]",
    name: "music_composer",
  })
  musicComposer!: string[];

  @Column({
    type: "boolean",
    nullable: false,
    default: false,
    name: "music_composer_lock",
  })
  musicComposerLock!: boolean;

  @Column({ type: "simple-json", nullable: false, default: "[]" })
  cast!: CastData[];

  @Column({ type: "varchar", nullable: true, default: "", name: "logo_src" })
  logoSrc!: string;

  @Column({
    type: "simple-json",
    nullable: false,
    default: "[]",
    name: "logos_urls",
  })
  logosUrls!: string[];

  @Column({ type: "varchar", nullable: true, default: "", name: "cover_src" })
  coverSrc!: string;

  @Column({
    type: "simple-json",
    nullable: false,
    default: "[]",
    name: "covers_urls",
  })
  coversUrls!: string[];

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

  @Column({ type: "varchar", nullable: false, default: "", name: "video_src" })
  videoSrc!: string;

  @Column({ type: "varchar", nullable: false, default: "", name: "music_src" })
  musicSrc!: string;

  @Column({ type: "varchar", nullable: false, default: "" })
  folder!: string;

  @Column({
    type: "boolean",
    nullable: false,
    default: false,
    name: "analyzing_files",
  })
  analyzingFiles!: boolean;

  @ManyToOne(() => LibraryModel, { onDelete: "CASCADE" })
  library!: LibraryModel;

  @ManyToMany(() => CollectionModel, (collection) => collection.movies)
  @JoinTable({
    name: "CollectionMovie",
    joinColumn: { name: "movieId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "collectionId", referencedColumnName: "id" },
  })
  collections!: CollectionModel[];

  @OneToMany(() => VideoModel, (video) => video.movie)
  videos!: VideoModel[];

  @OneToMany(() => VideoModel, (video) => video.extra)
  extras!: VideoModel[];

  @OneToMany(() => WatchListModel, (watchList) => watchList.movie)
  watchLists!: WatchListModel[];

  // Lifecycle hooks
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4().split("-")[0];
    }
  }
}
