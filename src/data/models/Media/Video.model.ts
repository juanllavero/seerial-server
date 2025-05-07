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
    type: DataType.TEXT,
    allowNull: true,
    field: "media_info",
    get() {
      const value = this.getDataValue("mediaInfo");
      return value ? JSON.parse(value) : undefined;
    },
    set(value: MediaInfo | undefined) {
      this.setDataValue("mediaInfo", value ? JSON.stringify(value) : null);
    },
  })
  mediaInfo?: MediaInfo;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: "video_tracks",
    get() {
      const value = this.getDataValue("videoTracks");
      return value ? JSON.parse(value) : undefined;
    },
    set(value: VideoTrack[] | undefined) {
      this.setDataValue("videoTracks", value ? JSON.stringify(value) : null);
    },
  })
  videoTracks?: VideoTrack[];

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: "subtitle_tracks",
    get() {
      const value = this.getDataValue("subtitleTracks");
      return value ? JSON.parse(value) : undefined;
    },
    set(value: SubtitleTrack[] | undefined) {
      this.setDataValue("subtitleTracks", value ? JSON.stringify(value) : null);
    },
  })
  subtitleTracks?: SubtitleTrack[];

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: "audio_tracks",
    get() {
      const value = this.getDataValue("audioTracks");
      return value ? JSON.parse(value) : undefined;
    },
    set(value: AudioTrack[] | undefined) {
      this.setDataValue("audioTracks", value ? JSON.stringify(value) : null);
    },
  })
  audioTracks?: AudioTrack[];

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue("chapters");
      return value ? JSON.parse(value) : undefined;
    },
    set(value: Chapter[] | undefined) {
      this.setDataValue("chapters", value ? JSON.stringify(value) : null);
    },
  })
  chapters?: Chapter[];

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "extra_type",
  })
  extraType?: string;

  @ForeignKey(() => Episode)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    onDelete: "CASCADE",
    field: "episode_id",
  })
  episodeId?: string;

  @BelongsTo(() => Movie, { foreignKey: "movieId", as: "movie" })
  movie?: Movie;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    onDelete: "CASCADE",
    field: "movie_id",
  })
  movieId?: string;

  @BelongsTo(() => Movie, { foreignKey: "extraId", as: "extra" })
  extra?: Movie;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    onDelete: "CASCADE",
    field: "extra_id",
  })
  extraId?: string;

  @ForeignKey(() => ContinueWatching)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "continue_watching_id",
  })
  continueWatchingId?: string;

  @BelongsTo(() => ContinueWatching)
  continueWatching?: ContinueWatching;
}
