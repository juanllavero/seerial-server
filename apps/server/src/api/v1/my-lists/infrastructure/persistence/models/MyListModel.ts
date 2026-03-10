import {
  BaseEntity,
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { MovieModel } from '@/api/v1/movies/infrastructure/persistence/models/MovieModel';
import { SeriesModel } from '@/api/v1/series/infrastructure/persistence/models/SeriesModel';

@Entity({ name: 'MyList' })
export class MyListModel extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', nullable: false })
  id!: string;

  @Column({ type: 'varchar', nullable: false })
  userId!: string;

  @Column({
    type: 'datetime',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  addedAt!: Date;

  @Column({ type: 'varchar', nullable: true })
  seriesId?: string;

  @Column({ type: 'varchar', nullable: true })
  movieId?: string;

  @ManyToOne(() => SeriesModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'series_id' })
  series?: SeriesModel;

  @ManyToOne(() => MovieModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie?: MovieModel;

  // Lifecycle hooks
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4().split('-')[0];
    }
  }
}
