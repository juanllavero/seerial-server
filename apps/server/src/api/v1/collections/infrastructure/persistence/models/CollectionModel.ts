import { BaseEntity, BeforeInsert, Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AlbumModel } from '@/api/v1/albums/infrastructure/persistence/models/AlbumModel';
import { LibraryCollectionModel } from '@/api/v1/libraries/infrastructure/persistence/models/LibraryCollectionModel';
import { MovieModel } from '@/api/v1/movies/infrastructure/persistence/models/MovieModel';
import { SeriesModel } from '@/api/v1/series/infrastructure/persistence/models/SeriesModel';

@Entity({ name: 'Collection' })
export class CollectionModel extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', nullable: false })
  id!: string;

  @Column({ type: 'varchar', nullable: false, unique: true })
  title!: string;

  @Column({ type: 'text', nullable: true, default: '' })
  description?: string;

  @Column({ type: 'varchar', nullable: true, default: '' })
  posterSrc!: string;

  @Column({
    type: 'simple-json',
    nullable: false,
    default: '[]',
    name: 'posters_urls',
  })
  postersUrls!: string[];

  @Column({
    type: 'varchar',
    nullable: true,
    default: '',
    name: 'music_poster_src',
  })
  musicPosterSrc!: string;

  @Column({
    type: 'simple-json',
    nullable: false,
    default: '[]',
    name: 'music_posters_urls',
  })
  musicPostersUrls!: string[];

  @Column({
    type: 'varchar',
    nullable: false,
    default: '',
    name: 'background_src',
  })
  backgroundSrc!: string;

  @Column({
    type: 'simple-json',
    nullable: false,
    default: '[]',
    name: 'background_urls',
  })
  backgroundsUrls!: string[];

  @OneToMany(
    () => LibraryCollectionModel,
    (lc) => lc.collection,
    {
      cascade: true,
    },
  )
  libraryCollections!: LibraryCollectionModel[];

  @OneToMany(
    () => MovieModel,
    (movie) => movie.collection,
  )
  movies!: MovieModel[];

  @OneToMany(
    () => SeriesModel,
    (series) => series.collection,
  )
  series!: SeriesModel[];

  @OneToMany(
    () => AlbumModel,
    (album) => album.collection,
  )
  albums!: AlbumModel[];

  // Lifecycle hooks
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4().split('-')[0];
    }
  }
}
