import {
  BaseEntity,
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { EpisodeModel } from '@/api/v1/episodes/infrastructure/persistence/models/EpisodeModel';
import { MovieModel } from '@/api/v1/movies/infrastructure/persistence/models/MovieModel';
import { WatchListModel } from '@/api/v1/watch-lists/infrastructure/persistence/models/WatchListModel';
import type {
  AudioTrack,
  Chapter,
  MediaInfo,
  SubtitleTrack,
  VideoTrack,
} from '@/data/interfaces/MediaInfo';

@Entity({ name: 'Video' })
export class VideoModel extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', nullable: false })
  id!: string;

  @Column({ type: 'varchar', nullable: false, default: '' })
  title!: string;

  @Column({ type: 'varchar', nullable: false })
  fileSrc!: string;

  @Column({ type: 'varchar', nullable: false, default: '' })
  hash!: string;

  @Column({ type: 'integer', nullable: false, default: 0 })
  runtime!: number;

  @Column({ type: 'varchar', nullable: false, default: '' })
  imgSrc!: string;

  @Column({
    type: 'simple-json',
    nullable: false,
    default: '[]',
  })
  imgUrls!: string[];

  @Column({ type: 'simple-json', nullable: true })
  mediaInfo?: MediaInfo;

  @Column({ type: 'simple-json', nullable: true })
  videoTracks?: VideoTrack[];

  @Column({ type: 'simple-json', nullable: true })
  subtitleTracks?: SubtitleTrack[];

  @Column({ type: 'simple-json', nullable: true })
  audioTracks?: AudioTrack[];

  @Column({ type: 'simple-json', nullable: true })
  chapters?: Chapter[];

  @Column({ type: 'integer', nullable: true })
  selectedAudioTrack?: number;

  @Column({ type: 'integer', nullable: true })
  selectedSubtitleTrack?: number;

  @Column({ type: 'varchar', nullable: true })
  extraType?: string;

  @ManyToOne(() => EpisodeModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'episode_id' })
  episode?: EpisodeModel;

  @Column({ type: 'varchar', nullable: true })
  episodeId?: string;

  @ManyToOne(() => MovieModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie?: MovieModel;

  @Column({ type: 'varchar', nullable: true })
  movieId?: string;

  @ManyToOne(() => MovieModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'extra_id' })
  extra?: MovieModel;

  @Column({ type: 'varchar', nullable: true })
  extraId?: string;

  @OneToMany(
    () => WatchListModel,
    (watchList) => watchList.video,
  )
  watchLists!: WatchListModel[];

  // Lifecycle hooks
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4().split('-')[0];
    }
  }
}
