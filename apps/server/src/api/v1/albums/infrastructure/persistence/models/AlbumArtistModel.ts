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
import { ArtistModel } from '@/api/v1/artists/infrastructure/persistence/models/ArtistModel';
import { AlbumModel } from './AlbumModel';

@Entity({ name: 'AlbumArtist' })
export class AlbumArtistModel extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', nullable: false })
  id!: string;

  @Column({ type: 'varchar', nullable: false })
  artistId!: string;

  @Column({ type: 'varchar', nullable: false })
  albumId!: string;

  @ManyToOne(() => ArtistModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'artist_id' })
  artist!: ArtistModel;

  @ManyToOne(() => AlbumModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'album_id' })
  album!: AlbumModel;

  // Lifecycle hooks
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4().split('-')[0];
    }
  }
}
