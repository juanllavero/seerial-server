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
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { MovieModel } from '@/api/v1/movies/infrastructure/persistence/models/MovieModel';
import { SeriesModel } from '@/api/v1/series/infrastructure/persistence/models/SeriesModel';
import { VideoModel } from '@/api/v1/videos/infrastructure/persistence/models/VideoModel';

@Entity({ name: 'ContinueWatching' })
export class ContinueWatchingModel extends BaseEntity {
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
  movieId?: string;

  @ManyToOne(() => MovieModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie?: MovieModel;

  @Column({ type: 'varchar', nullable: false })
  videoId!: string;

  @ManyToOne(() => VideoModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'video_id' })
  video!: VideoModel;

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
