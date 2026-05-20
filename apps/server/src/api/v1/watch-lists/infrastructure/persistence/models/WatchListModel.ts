import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { EpisodeModel } from '@/api/v1/episodes/infrastructure/persistence/models/EpisodeModel';
import { MovieModel } from '@/api/v1/movies/infrastructure/persistence/models/MovieModel';
import { SeasonModel } from '@/api/v1/seasons/infrastructure/persistence/models/SeasonModel';
import { SeriesModel } from '@/api/v1/series/infrastructure/persistence/models/SeriesModel';
import { VideoModel } from '@/api/v1/videos/infrastructure/persistence/models/VideoModel';

@Entity({ name: 'WatchList' })
@Index('idx_watchlist_user_series_watched', ['userId', 'seriesId', 'watched'])
@Index('idx_watchlist_user_episode_watched', ['userId', 'episodeId', 'watched'])
export class WatchListModel extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', nullable: false })
  id!: string;

  @Column({ type: 'varchar', nullable: false })
  userId!: string;

  @Column({ type: 'varchar', nullable: true })
  seriesId?: string;

  @ManyToOne(() => SeriesModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'series_id' })
  series?: SeriesModel;

  @Column({ type: 'varchar', nullable: true })
  seasonId?: string;

  @ManyToOne(() => SeasonModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'season_id' })
  season?: SeasonModel;

  @Column({ type: 'varchar', nullable: true })
  episodeId?: string;

  @ManyToOne(() => EpisodeModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'episode_id' })
  episode?: EpisodeModel;

  @Column({ type: 'varchar', nullable: true })
  movieId?: string;

  @ManyToOne(() => MovieModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie?: MovieModel;

  @Column({ type: 'varchar', nullable: true })
  videoId?: string;

  @ManyToOne(() => VideoModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'video_id' })
  video?: VideoModel;

  @Column({
    type: 'integer',
    nullable: false,
    default: 0,
  })
  timeWatched!: number;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
  })
  watched!: boolean;

  @Column({
    type: 'varchar',
    nullable: false,
    default: '',
  })
  lastWatched!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Lifecycle hooks
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4().split('-')[0];
    }
  }
}
