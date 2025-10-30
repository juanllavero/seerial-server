import { ContinueWatchingModel } from "@/api/v0/continue-watching/infrastructure/persistence/models/ContinueWatchingModel";
import { EpisodeModel } from "@/api/v0/episodes/infrastructure/persistence/models/EpisodeModel";
import { MovieModel } from "@/api/v0/movies/infrastructure/persistence/models/MovieModel";
import { WatchListModel } from "@/api/v0/watch-lists/infrastructure/persistence/models/WatchListModel";
import {
  AudioTrack,
  Chapter,
  MediaInfo,
  SubtitleTrack,
  VideoTrack,
} from "@/data/interfaces/MediaInfo";
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";

@Table({ tableName: "Video", timestamps: false })
export class VideoModel extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => require("uuid").v4().split("-")[0],
    allowNull: false,
  })
  id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: "",
    field: "title",
  })
  title!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "file_src",
  })
  fileSrc!: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    allowNull: false,
  })
  runtime!: number;

  @Column({
    type: DataType.STRING,
    defaultValue: "",
    allowNull: false,
    field: "img_src",
  })
  imgSrc!: string;

  @Column({
    type: DataType.JSON,
    defaultValue: [],
    allowNull: false,
    field: "img_urls",
  })
  imgUrls!: string[];

  @Column({
    type: DataType.JSON,
    allowNull: true,
    field: "media_info",
  })
  mediaInfo?: MediaInfo;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    field: "video_tracks",
  })
  videoTracks?: VideoTrack[];

  @Column({
    type: DataType.JSON,
    allowNull: true,
    field: "subtitle_tracks",
  })
  subtitleTracks?: SubtitleTrack[];

  @Column({
    type: DataType.JSON,
    allowNull: true,
    field: "audio_tracks",
  })
  audioTracks?: AudioTrack[];

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  chapters?: Chapter[];

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: "selected_audio_track",
  })
  selectedAudioTrack?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: "selected_subtitle_track",
  })
  selectedSubtitleTrack?: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "extra_type",
  })
  extraType?: string;

  @BelongsTo(() => EpisodeModel, {
    foreignKey: "episodeId",
    as: "episode",
    onDelete: "CASCADE",
    hooks: true,
  })
  episode?: EpisodeModel;

  @ForeignKey(() => EpisodeModel)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "episode_id",
    onDelete: "CASCADE",
  })
  episodeId?: string;

  @BelongsTo(() => MovieModel, {
    foreignKey: "movieId",
    as: "movie",
    onDelete: "CASCADE",
    hooks: true,
  })
  movie?: MovieModel;

  @ForeignKey(() => MovieModel)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "movie_id",
    onDelete: "CASCADE",
  })
  movieId?: string;

  @BelongsTo(() => MovieModel, {
    foreignKey: "extraId",
    as: "extra",
    onDelete: "CASCADE",
    hooks: true,
  })
  extra?: MovieModel;

  @ForeignKey(() => MovieModel)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "extra_id",
    onDelete: "CASCADE",
  })
  extraId?: string;

  @HasMany(() => ContinueWatchingModel)
  continueWatching!: ContinueWatchingModel[];

  @HasMany(() => WatchListModel)
  watchLists!: WatchListModel[];
}
