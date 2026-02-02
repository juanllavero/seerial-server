import {
  BaseEntity,
  BeforeInsert,
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { PlayListItemModel } from "./PlayListItemModel";

@Entity({ name: "PlayList" })
export class PlayListModel extends BaseEntity {
  @PrimaryColumn({ type: "varchar", nullable: false })
  id!: string;

  @Column({ type: "varchar", nullable: false, name: "user_id" })
  userId!: string;

  @Column({ type: "varchar", nullable: false })
  title!: string;

  @Column({ type: "varchar", nullable: true, default: "" })
  description?: string;

  @OneToMany(() => PlayListItemModel, (item) => item.playList, {
    cascade: true,
  })
  items!: PlayListItemModel[];

  // Lifecycle hooks
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4().split("-")[0];
    }
  }
}
