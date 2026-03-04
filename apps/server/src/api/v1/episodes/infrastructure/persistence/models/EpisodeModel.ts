import { SeasonModel } from "@/api/v1/seasons/infrastructure/persistence/models/SeasonModel";
import { VideoModel } from "@/api/v1/videos/infrastructure/persistence/models/VideoModel";
import { WatchListModel } from "@/api/v1/watch-lists/infrastructure/persistence/models/WatchListModel";
import {
  BaseEntity,
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";

@Entity({ name: "Episode" })
export class EpisodeModel extends BaseEntity {
  @PrimaryColumn({ type: "varchar", nullable: false })
  id!: string;

  @Column({ type: "varchar", nullable: false })
  seasonId!: string;

  @Column({ type: "varchar", nullable: false, default: "" })
  name!: string;

  @Column({
    type: "boolean",
    nullable: false,
    default: false,
    name: "name_lock",
  })
  nameLock!: boolean;

  @Column({ type: "varchar", nullable: false, default: "" })
  year!: string;

  @Column({
    type: "boolean",
    nullable: false,
    default: false,
    name: "year_lock",
  })
  yearLock!: boolean;

  @Column({ type: "text", nullable: false, default: "" })
  overview!: string;

  @Column({
    type: "boolean",
    nullable: false,
    default: false,
    name: "overview_lock",
  })
  overviewLock!: boolean;

  @Column({ type: "float", nullable: false, default: 0 })
  score!: number;

  @Column({
    type: "simple-json",
    nullable: false,
    default: "[]",
    name: "directed_by",
  })
  directedBy!: string[];

  @Column({
    type: "boolean",
    nullable: false,
    default: false,
    name: "directed_by_lock",
  })
  directedByLock!: boolean;

  @Column({
    type: "simple-json",
    nullable: false,
    default: "[]",
    name: "written_by",
  })
  writtenBy!: string[];

  @Column({
    type: "boolean",
    nullable: false,
    default: false,
    name: "written_by_lock",
  })
  writtenByLock!: boolean;

  @Column({
    type: "integer",
    nullable: false,
    default: 0,
    name: "season_number",
  })
  seasonNumber!: number;

  @Column({
    type: "integer",
    nullable: false,
    default: 0,
    name: "episode_number",
  })
  episodeNumber!: number;

  @Column({ type: "integer", nullable: false, default: 0 })
  order!: number;

  @OneToMany(() => WatchListModel, (watchList) => watchList.episode)
  watchLists!: WatchListModel[];

  @ManyToOne(() => SeasonModel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "season_id" })
  season!: SeasonModel;

  @OneToOne(() => VideoModel, (video) => video.episode)
  video!: VideoModel;

  // Lifecycle hooks
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4().split("-")[0];
    }
  }
}
