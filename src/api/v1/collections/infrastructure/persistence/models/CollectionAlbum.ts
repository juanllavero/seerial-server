import { AlbumModel } from "@/api/v1/albums/infrastructure/persistence/models/AlbumModel";
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { CollectionModel } from "./CollectionModel";

@Entity({ name: "Collection_Album" })
export class CollectionAlbumModel extends BaseEntity {
  @PrimaryColumn({ type: "varchar", nullable: false, name: "collection_id" })
  collectionId!: string;

  @PrimaryColumn({ type: "varchar", nullable: false, name: "album_id" })
  albumId!: string;

  @Column({
    type: "integer",
    nullable: false,
    default: 0,
    name: "custom_order",
  })
  customOrder!: number;

  @ManyToOne(() => CollectionModel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "collection_id" })
  collection!: CollectionModel;

  @ManyToOne(() => AlbumModel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "album_id" })
  album!: AlbumModel;
}
