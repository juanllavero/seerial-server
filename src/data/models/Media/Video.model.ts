import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import {
  AudioTrack,
  Chapter,
  MediaInfo,
  SubtitleTrack,
  VideoTrack,
} from "../../interfaces/MediaInfo";
import { ContinueWatching } from "../Lists/ContinueWatching.model";
import { Episode } from "./Episode.model";
import { Movie } from "./Movie.model";

@Table({ tableName: "Video", timestamps: false })
export class Video extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => require("uuid").v4().split("-")[0], // Generates default UUID
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
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  })
  watched!: boolean;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: "time_watched",
  })
  timeWatched!: number;

  @Column({
    type: DataType.STRING,
    defaultValue: "",
    allowNull: false,
    field: "last_watched",
  })
  lastWatched!: string;

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

  @BelongsTo(() => Episode, {
    foreignKey: "episodeId",
    as: "episode",
    onDelete: "CASCADE",
    hooks: true,
  })
  episode?: Episode;

  @ForeignKey(() => Episode)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "episode_id",
    onDelete: "CASCADE",
  })
  episodeId?: string;

  @BelongsTo(() => Movie, {
    foreignKey: "movieId",
    as: "movie",
    onDelete: "CASCADE",
    hooks: true,
  })
  movie?: Movie;

  @ForeignKey(() => Movie)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "movie_id",
    onDelete: "CASCADE",
  })
  movieId?: string;

  @BelongsTo(() => Movie, {
    foreignKey: "extraId",
    as: "extra",
    onDelete: "CASCADE",
    hooks: true,
  })
  extra?: Movie;

  @ForeignKey(() => Movie)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "extra_id",
    onDelete: "CASCADE",
  })
  extraId?: string;

  @ForeignKey(() => ContinueWatching)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "continue_watching_id",
  })
  continueWatchingId?: string;

  @BelongsTo(() => ContinueWatching, {
    onDelete: "CASCADE",
    hooks: true,
  })
  continueWatching?: ContinueWatching;
}
