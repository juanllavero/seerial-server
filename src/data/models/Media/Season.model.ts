import {
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Episode } from './Episode.model';
import { Series } from './Series.model';

@Table({ tableName: 'Season', timestamps: false })
export class Season extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => uuidv4(), // Generates default UUID
    allowNull: false,
  })
  id!: string;

  @ForeignKey(() => Series)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onDelete: 'CASCADE',
    field: 'series_id',
  })
  seriesId!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'themdb_id',
  })
  themdbId!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  order!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: 'name_lock',
  })
  nameLock!: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  year!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: 'year_lock',
  })
  yearLock!: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  overview!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: 'overview_lock',
  })
  overviewLock!: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'season_number',
  })
  seasonNumber!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'cover_src',
  })
  coverSrc!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'covers_urls',
    get() {
      const value = this.getDataValue('coversUrls');
      return value ? JSON.parse(value) : [];
    },
    set(value: string[]) {
      this.setDataValue('coversUrls', JSON.stringify(value));
    },
  })
  coversUrls!: string[];

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'background_src',
  })
  backgroundSrc!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'background_urls',
    get() {
      const value = this.getDataValue('backgroundsUrls');
      return value ? JSON.parse(value) : [];
    },
    set(value: string[]) {
      this.setDataValue('backgroundsUrls', JSON.stringify(value));
    },
  })
  backgroundsUrls!: string[];

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'video_src',
  })
  videoSrc!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'music_src',
  })
  musicSrc!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  folder!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'audio_track_language',
  })
  audioTrackLanguage!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'selected_audio_track',
  })
  selectedAudioTrack!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'subtitle_track_language',
  })
  subtitleTrackLanguage!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'selected_subtitle_track',
  })
  selectedSubtitleTrack!: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  watched!: boolean;

  @HasMany(() => Episode)
  episodes!: Episode[];
}
