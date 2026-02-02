import { CollectionSeriesModel } from "@/api/v1/collections/infrastructure/persistence/models/CollectionSeries";
import { LibraryModel } from "@/api/v1/libraries/infrastructure/persistence/models/LibraryModel";
import { SeasonModel } from "@/api/v1/seasons/infrastructure/persistence/models/SeasonModel";
import { useCases } from "@/api/v1/shared/infrastructure/adapters/di/container";
import { WatchListModel } from "@/api/v1/watch-lists/infrastructure/persistence/models/WatchListModel";
import { CastData } from "@/data/interfaces/Media";
import logger from "@/utils/logger";
import {
  BaseEntity,
  BeforeInsert,
  BeforeRemove,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";

const seriesLogger = logger.child({ category: "Series" });

@Entity({ name: "Series" })
export class SeriesModel extends BaseEntity {
  @PrimaryColumn({ type: "varchar", nullable: false })
  id!: string;

  @Column({ type: "varchar", nullable: false, name: "library_id" })
  libraryId!: string;

  @Column({ type: "integer", nullable: false, default: -1, name: "themdb_id" })
  themdbId!: number;

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
    name: "oberview_lock",
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

  @Column({ type: "float", nullable: false, default: 0 })
  score!: number;

  @Column({ type: "varchar", nullable: false, default: "" })
  tagline!: string;

  @Column({
    type: "boolean",
    nullable: false,
    default: false,
    name: "tagline_lock",
  })
  taglineLock!: boolean;

  @Column({ type: "varchar", nullable: false, default: "", name: "logo_src" })
  logoSrc!: string;

  @Column({
    type: "simple-json",
    nullable: false,
    default: "[]",
    name: "logos_urls",
  })
  logosUrls!: string[];

  @Column({ type: "varchar", nullable: false, default: "", name: "cover_src" })
  coverSrc!: string;

  @Column({
    type: "simple-json",
    nullable: false,
    default: "[]",
    name: "covers_urls",
  })
  coversUrls!: string[];

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
  genres!: string[];

  @Column({
    type: "boolean",
    nullable: false,
    default: false,
    name: "genres_lock",
  })
  genresLock!: boolean;

  @Column({ type: "simple-json", nullable: false, default: "[]" })
  cast!: CastData[];

  @Column({ type: "varchar", nullable: false, default: "" })
  folder!: string;

  @Column({ type: "varchar", nullable: true, name: "episode_group_id" })
  episodeGroupId!: string | null;

  @Column({
    type: "boolean",
    nullable: false,
    default: false,
    name: "analyzing_files",
  })
  analyzingFiles!: boolean;

  @Column({ type: "varchar", nullable: true, name: "prefer_audio_lan" })
  preferAudioLan?: string;

  @Column({ type: "varchar", nullable: true, name: "prefer_sub_lan" })
  preferSubLan?: string;

  @Column({ type: "varchar", nullable: true, name: "subs_mode" })
  subsMode?: string;

  @ManyToOne(() => LibraryModel, { onDelete: "CASCADE" })
  library!: LibraryModel;

  @OneToMany(() => CollectionSeriesModel, (cs) => cs.series, { cascade: true })
  collectionSeries!: CollectionSeriesModel[];

  @OneToMany(() => SeasonModel, (season) => season.series)
  seasons!: SeasonModel[];

  @OneToMany(() => WatchListModel, (watchList) => watchList.series)
  watchLists!: WatchListModel[];

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
      // Delete stored data
      const deleteSeriesData = useCases.deleteSeriesData();
      await deleteSeriesData.execute(this.id);

      // Remove folder stored in library
      const getLibrary = useCases.getLibrary();
      const library = await getLibrary.execute(this.libraryId);

      if (!library) return;

      const removeAnalyzedFolder = useCases.removeAnalyzedFolder();
      await removeAnalyzedFolder.execute(library.id, this.folder);
      seriesLogger.info(`Cleaned data from series ID=${this.id}`);
    } catch (error) {
      seriesLogger.error(error, `Error cleaning data for series ID=${this.id}`);
    }
  }
}
