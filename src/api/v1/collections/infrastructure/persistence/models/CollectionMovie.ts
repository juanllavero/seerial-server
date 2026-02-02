import { MovieModel } from "@/api/v1/movies/infrastructure/persistence/models/MovieModel";
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { CollectionModel } from "./CollectionModel";

@Entity({ name: "Collection_Movie" })
export class CollectionMovieModel extends BaseEntity {
  @PrimaryColumn({ type: "varchar", nullable: false, name: "collection_id" })
  collectionId!: string;

  @PrimaryColumn({ type: "varchar", nullable: false, name: "movie_id" })
  movieId!: string;

  @Column({
    type: "integer",
    nullable: false,
    default: 0,
    name: "custom_order",
  })
  customOrder!: number;

  @ManyToOne(() => CollectionModel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "collection_id" })
  collection!: CollectionModel;

  @ManyToOne(() => MovieModel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "movie_id" })
  movie!: MovieModel;
}
