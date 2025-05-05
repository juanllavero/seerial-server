import {
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Movie } from '../Media/Movie.model';
import { Series } from '../Media/Series.model';

@Table({ tableName: 'My_List', timestamps: false })
export class MyList extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => uuidv4(), // Generates default UUID
    allowNull: false,
  })
  id!: string;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
    allowNull: false,
    field: 'added_at',
  })
  addedAt!: Date;

  @ForeignKey(() => Series)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'series_id',
  })
  seriesId?: number;

  @ForeignKey(() => Movie)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'movie_id',
  })
  movieId?: number;
}
