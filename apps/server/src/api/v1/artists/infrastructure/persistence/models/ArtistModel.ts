import { BaseEntity, BeforeInsert, Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AlbumArtistModel } from '@/api/v1/albums/infrastructure/persistence/models/AlbumArtistModel';

@Entity({ name: 'Artist' })
export class ArtistModel extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', nullable: false })
  id!: string;

  @Column({ type: 'varchar', nullable: false })
  name!: string;

  @OneToMany(
    () => AlbumArtistModel,
    (aa) => aa.artist,
  )
  albumArtists!: AlbumArtistModel[];

  // Lifecycle hooks
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4().split('-')[0];
    }
  }
}
