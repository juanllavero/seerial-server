import { EpisodeModel } from "@/api/v1/episodes/infrastructure/persistence/models/EpisodeModel";
import { SeriesModel } from "@/api/v1/series/infrastructure/persistence/models/SeriesModel";
import { WatchListModel } from "@/api/v1/watch-lists/infrastructure/persistence/models/WatchListModel";
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

@Entity({ name: "Season" })
export class SeasonModel extends BaseEntity {
  @PrimaryColumn({ type: "varchar", nullable: false })
  id!: string;

  @Column({ type: "varchar", nullable: false, name: "series_id" })
  seriesId!: string;

  @Column({ type: "integer", nullable: false, default: 0 })
  order!: number;

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

  @Column({
    type: "integer",
    nullable: false,
    default: 0,
    name: "season_number",
  })
  seasonNumber!: number;

  @Column({
    type: "varchar",
    nullable: false,
    default: "",
    name: "background_src",
  })
  backgroundSrc!: string;

  @Column({
    type: "simple-json",
    nullable: false,
    default: "[]",
    name: "background_urls",
  })
  backgroundsUrls!: string[];

  @Column({ type: "varchar", nullable: false, default: "", name: "video_src" })
  videoSrc!: string;

  @Column({ type: "varchar", nullable: false, default: "", name: "music_src" })
  musicSrc!: string;

  @ManyToOne(() => SeriesModel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "series_id" })
  series!: SeriesModel;

  @OneToMany(() => EpisodeModel, (episode) => episode.season)
  episodes!: EpisodeModel[];

  @OneToMany(() => WatchListModel, (watchList) => watchList.season)
  watchLists!: WatchListModel[];

  // Lifecycle hooks
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4().split("-")[0];
    }
  }
}
