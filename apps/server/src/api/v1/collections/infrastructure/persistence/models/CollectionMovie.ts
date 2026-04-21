import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MovieModel } from '@/api/v1/movies/infrastructure/persistence/models/MovieModel';
import { CollectionModel } from './CollectionModel';

@Entity({ name: 'CollectionMovie' })
export class CollectionMovieModel extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', nullable: false })
  collectionId!: string;

  @PrimaryColumn({ type: 'varchar', nullable: false })
  movieId!: string;

  @Column({
    type: 'integer',
    nullable: false,
    default: 0,
    name: 'custom_order',
  })
  customOrder!: number;

  @ManyToOne(() => CollectionModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'collection_id' })
  collection!: CollectionModel;

  @ManyToOne(() => MovieModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie!: MovieModel;
}
