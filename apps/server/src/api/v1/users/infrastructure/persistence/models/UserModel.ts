import { BaseEntity, BeforeInsert, Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import type { UserType } from '../../../domain/User';
import { UserLibraryModel } from './UserLibraryModel';

@Entity({ name: 'User' })
export class UserModel extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', nullable: false })
  id!: string;

  @Column({ type: 'varchar', nullable: false, unique: true })
  username!: string;

  @Column({ type: 'varchar', nullable: true }) // Store hashed password
  password?: string;

  @Column({ type: 'varchar', nullable: true })
  avatar?: string;

  @Column({
    type: 'boolean',
    nullable: false,
    default: true,
  })
  allowRemote!: boolean;

  @Column({ type: 'varchar', nullable: false, default: 'normal' })
  type!: UserType;

  @Column({
    type: 'boolean',
    nullable: false,
    default: true,
  })
  allowVideoTranscoding!: boolean;

  @Column({ type: 'integer', nullable: true }) // In Mbps
  internetBitrateLimit?: number;

  @Column({
    type: 'boolean',
    nullable: false,
    default: true,
  })
  allowDownloads!: boolean;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
  })
  hideInLogin!: boolean;

  @Column({
    type: 'integer',
    nullable: false,
    default: 0,
  }) // 0 for unlimited
  maxSessions!: number;

  @OneToMany(
    () => UserLibraryModel,
    (userLibrary) => userLibrary.user,
    {
      cascade: true,
    },
  )
  userLibraries!: UserLibraryModel[];

  // Lifecycle hooks
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4().split('-')[0];
    }
  }
}
