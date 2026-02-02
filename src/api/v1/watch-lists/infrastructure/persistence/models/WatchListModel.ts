import { EpisodeModel } from "@/api/v1/episodes/infrastructure/persistence/models/EpisodeModel";
import { MovieModel } from "@/api/v1/movies/infrastructure/persistence/models/MovieModel";
import { SeasonModel } from "@/api/v1/seasons/infrastructure/persistence/models/SeasonModel";
import { SeriesModel } from "@/api/v1/series/infrastructure/persistence/models/SeriesModel";
import { VideoModel } from "@/api/v1/videos/infrastructure/persistence/models/VideoModel";
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";

@Entity({ name: "WatchList" })
export class WatchListModel extends BaseEntity {
  @PrimaryColumn({ type: "varchar", nullable: false })
  id!: string;

  @Column({ type: "varchar", nullable: false, name: "user_id" })
  userId!: string;

  @Column({ type: "varchar", nullable: true, name: "series_id" })
  seriesId?: string;

  @ManyToOne(() => SeriesModel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "series_id" })
  series?: SeriesModel;

  @Column({ type: "varchar", nullable: true, name: "season_id" })
  seasonId?: string;

  @ManyToOne(() => SeasonModel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "season_id" })
  season?: SeasonModel;

  @Column({ type: "varchar", nullable: true, name: "episode_id" })
  episodeId?: string;

  @ManyToOne(() => EpisodeModel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "episode_id" })
  episode?: EpisodeModel;

  @Column({ type: "varchar", nullable: true, name: "movie_id" })
  movieId?: string;

  @ManyToOne(() => MovieModel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "movie_id" })
  movie?: MovieModel;

  @Column({ type: "varchar", nullable: true, name: "video_id" })
  videoId?: string;

  @ManyToOne(() => VideoModel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "video_id" })
  video?: VideoModel;

  @Column({
    type: "integer",
    nullable: false,
    default: 0,
    name: "time_watched",
  })
  timeWatched!: number;

  @Column({
    type: "varchar",
    nullable: false,
    default: "",
    name: "last_watched",
  })
  lastWatched!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  // Lifecycle hooks
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4().split("-")[0];
    }
  }
}
