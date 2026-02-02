import { MovieModel } from "@/api/v1/movies/infrastructure/persistence/models/MovieModel";
import { SeriesModel } from "@/api/v1/series/infrastructure/persistence/models/SeriesModel";
import {
  BaseEntity,
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";

@Entity({ name: "My_List" })
export class MyListModel extends BaseEntity {
  @PrimaryColumn({ type: "varchar", nullable: false })
  id!: string;

  @Column({ type: "varchar", nullable: false, name: "user_id" })
  userId!: string;

  @Column({
    type: "timestamp",
    nullable: false,
    name: "added_at",
    default: () => "CURRENT_TIMESTAMP",
  })
  addedAt!: Date;

  @Column({ type: "varchar", nullable: true, name: "series_id" })
  seriesId?: string;

  @Column({ type: "varchar", nullable: true, name: "movie_id" })
  movieId?: string;

  @ManyToOne(() => SeriesModel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "series_id" })
  series?: SeriesModel;

  @ManyToOne(() => MovieModel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "movie_id" })
  movie?: MovieModel;

  // Lifecycle hooks
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4().split("-")[0];
    }
  }
}
