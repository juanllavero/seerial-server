import { ContinueWatchingModel } from "@/api/v1/continue-watching/infrastructure/persistence/models/ContinueWatchingModel";
import { EpisodeModel } from "@/api/v1/episodes/infrastructure/persistence/models/EpisodeModel";
import { MovieModel } from "@/api/v1/movies/infrastructure/persistence/models/MovieModel";
import { WatchListModel } from "@/api/v1/watch-lists/infrastructure/persistence/models/WatchListModel";
import {
  AudioTrack,
  Chapter,
  MediaInfo,
  SubtitleTrack,
  VideoTrack,
} from "@/data/interfaces/MediaInfo";
import {
  BaseEntity,
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";

@Entity({ name: "Video" })
export class VideoModel extends BaseEntity {
  @PrimaryColumn({ type: "varchar", nullable: false })
  id!: string;

  @Column({ type: "varchar", nullable: false, default: "", name: "title" })
  title!: string;

  @Column({ type: "varchar", nullable: false, name: "file_src" })
  fileSrc!: string;

  @Column({ type: "integer", nullable: false, default: 0 })
  runtime!: number;

  @Column({ type: "varchar", nullable: false, default: "", name: "img_src" })
  imgSrc!: string;

  @Column({
    type: "simple-json",
    nullable: false,
    default: "[]",
    name: "img_urls",
  })
  imgUrls!: string[];

  @Column({ type: "simple-json", nullable: true, name: "media_info" })
  mediaInfo?: MediaInfo;

  @Column({ type: "simple-json", nullable: true, name: "video_tracks" })
  videoTracks?: VideoTrack[];

  @Column({ type: "simple-json", nullable: true, name: "subtitle_tracks" })
  subtitleTracks?: SubtitleTrack[];

  @Column({ type: "simple-json", nullable: true, name: "audio_tracks" })
  audioTracks?: AudioTrack[];

  @Column({ type: "simple-json", nullable: true })
  chapters?: Chapter[];

  @Column({ type: "integer", nullable: true, name: "selected_audio_track" })
  selectedAudioTrack?: number;

  @Column({ type: "integer", nullable: true, name: "selected_subtitle_track" })
  selectedSubtitleTrack?: number;

  @Column({ type: "varchar", nullable: true, name: "extra_type" })
  extraType?: string;

  @ManyToOne(() => EpisodeModel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "episode_id" })
  episode?: EpisodeModel;

  @Column({ type: "varchar", nullable: true, name: "episode_id" })
  episodeId?: string;

  @ManyToOne(() => MovieModel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "movie_id" })
  movie?: MovieModel;

  @Column({ type: "varchar", nullable: true, name: "movie_id" })
  movieId?: string;

  @ManyToOne(() => MovieModel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "extra_id" })
  extra?: MovieModel;

  @Column({ type: "varchar", nullable: true, name: "extra_id" })
  extraId?: string;

  @OneToMany(
    () => ContinueWatchingModel,
    (continueWatching) => continueWatching.video
  )
  continueWatching!: ContinueWatchingModel[];

  @OneToMany(() => WatchListModel, (watchList) => watchList.video)
  watchLists!: WatchListModel[];

  // Lifecycle hooks
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4().split("-")[0];
    }
  }
}
