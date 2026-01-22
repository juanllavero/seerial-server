import { CollectionModel } from "@/api/v1/collections/infrastructure/persistence/models/CollectionModel";
import { CollectionSeriesModel } from "@/api/v1/collections/infrastructure/persistence/models/CollectionSeries";
import { LibraryModel } from "@/api/v1/libraries/infrastructure/persistence/models/LibraryModel";
import { SeasonModel } from "@/api/v1/seasons/infrastructure/persistence/models/SeasonModel";
import { useCases } from "@/api/v1/shared/infrastructure/adapters/di/container";
import { WatchListModel } from "@/api/v1/watch-lists/infrastructure/persistence/models/WatchListModel";
import { CastData } from "@/data/interfaces/Media";
import logger from "@/utils/logger";
import {
  BeforeDestroy,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";

const seriesLogger = logger.child({ category: "Series" });

@Table({ tableName: "Series", timestamps: false })
export class SeriesModel extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => require("uuid").v4().split("-")[0],
    allowNull: false,
  })
  id!: string;

  @ForeignKey(() => LibraryModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    onDelete: "CASCADE",
    field: "library_id",
  })
  libraryId!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: -1,
    field: "themdb_id",
  })
  themdbId!: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    allowNull: false,
  })
  order!: number;

  @Column({
    type: DataType.STRING,
    defaultValue: "",
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: "name_lock",
  })
  nameLock!: boolean;

  @Column({
    type: DataType.TEXT,
    defaultValue: "",
    allowNull: false,
  })
  overview!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: "oberview_lock",
  })
  overviewLock!: boolean;

  @Column({
    type: DataType.STRING,
    defaultValue: "",
    allowNull: false,
  })
  year!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: "year_lock",
  })
  yearLock!: boolean;

  @Column({
    type: DataType.FLOAT,
    defaultValue: 0,
    allowNull: false,
  })
  score!: number;

  @Column({
    type: DataType.STRING,
    defaultValue: "",
    allowNull: false,
  })
  tagline!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: "tagline_lock",
  })
  taglineLock!: boolean;

  @Column({
    type: DataType.STRING,
    defaultValue: "",
    allowNull: false,
    field: "logo_src",
  })
  logoSrc!: string;

  @Column({
    type: DataType.JSON,
    defaultValue: [],
    allowNull: false,
    field: "logos_urls",
  })
  logosUrls!: string[];

  @Column({
    type: DataType.STRING,
    defaultValue: "",
    allowNull: false,
    field: "cover_src",
  })
  coverSrc!: string;

  @Column({
    type: DataType.JSON,
    defaultValue: [],
    allowNull: false,
    field: "covers_urls",
  })
  coversUrls!: string[];

  @Column({
    type: DataType.JSON,
    defaultValue: [],
    allowNull: false,
    field: "production_studios",
  })
  productionStudios!: string[];

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: "production_studios_lock",
  })
  productionStudiosLock!: boolean;

  @Column({
    type: DataType.JSON,
    defaultValue: [],
    allowNull: false,
  })
  creator!: string[];

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: "creator_lock",
  })
  creatorLock!: boolean;

  @Column({
    type: DataType.JSON,
    defaultValue: [],
    allowNull: false,
    field: "music_composer",
  })
  musicComposer!: string[];

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: "music_composer_lock",
  })
  musicComposerLock!: boolean;

  @Column({
    type: DataType.JSON,
    defaultValue: [],
    allowNull: false,
  })
  genres!: string[];

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: "genres_lock",
  })
  genresLock!: boolean;

  @Column({
    type: DataType.JSON,
    defaultValue: [],
    allowNull: false,
  })
  cast!: CastData[];

  @Column({
    type: DataType.STRING,
    defaultValue: "",
    allowNull: false,
  })
  folder!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "episode_group_id",
  })
  episodeGroupId!: string | null;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: "analyzing_files",
  })
  analyzingFiles!: boolean;

  @HasMany(() => WatchListModel)
  watchLists!: WatchListModel[];

  @Column({ type: DataType.STRING, allowNull: true, field: "prefer_audio_lan" })
  preferAudioLan?: string;

  @Column({ type: DataType.STRING, allowNull: true, field: "prefer_sub_lan" })
  preferSubLan?: string;

  @Column({ type: DataType.STRING, allowNull: true, field: "subs_mode" })
  subsMode?: string;

  @BelongsTo(() => LibraryModel, { onDelete: "CASCADE" })
  library!: LibraryModel;

  @BelongsToMany(() => CollectionModel, {
    through: () => CollectionSeriesModel,
    onDelete: "CASCADE",
    hooks: true,
  })
  collections!: CollectionModel[];

  @HasMany(() => SeasonModel)
  seasons!: SeasonModel[];

  CollectionSeries?: {
    custom_order: number;
  };

  @BeforeDestroy
  static async beforeDestroyHook(instance: SeriesModel): Promise<void> {
    try {
      // Delete stored data
      const deleteSeriesData = useCases.deleteSeriesData();
      await deleteSeriesData.execute(instance.id);

      // Remove folder stored in library
      const getLibrary = useCases.getLibrary();
      const library = await getLibrary.execute(instance.libraryId);

      if (!library) return;

      const removeAnalyzedFolder = useCases.removeAnalyzedFolder();
      await removeAnalyzedFolder.execute(library.id, instance.folder);
      seriesLogger.info(`Cleaned data from series ID=${instance.id}`);
    } catch (error) {
      seriesLogger.error(
        error,
        `Error cleaning data for series ID=${instance.id}`
      );
    }
  }
}
