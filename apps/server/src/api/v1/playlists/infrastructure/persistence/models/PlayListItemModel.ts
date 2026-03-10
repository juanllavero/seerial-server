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
import { SongModel } from '@/api/v1/songs/infrastructure/persistence/models/SongModel';
import { PlayListModel } from './PlayListModel';

@Entity({ name: 'PlayListItem' })
export class PlayListItemModel extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', nullable: false })
  id!: string;

  @Column({ type: 'varchar', nullable: false })
  playlistId!: string;

  @Column({ type: 'varchar', nullable: false })
  songId!: string;

  @ManyToOne(() => PlayListModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'playlist_id' })
  playList!: PlayListModel;

  @ManyToOne(() => SongModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'song_id' })
  song!: SongModel;

  // Lifecycle hooks
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4().split('-')[0];
    }
  }
}
