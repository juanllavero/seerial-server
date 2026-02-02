import { CollectionModel } from "@/api/v1/collections/infrastructure/persistence/models/CollectionModel";
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { LibraryModel } from "./LibraryModel";

@Entity({ name: "LibraryCollection" })
export class LibraryCollectionModel extends BaseEntity {
  @PrimaryColumn({ type: "varchar", nullable: false, name: "library_id" })
  libraryId!: string;

  @PrimaryColumn({ type: "varchar", nullable: false, name: "collection_id" })
  collectionId!: string;

  @Column({
    type: "integer",
    nullable: false,
    default: 0,
    name: "custom_order",
  })
  customOrder!: number;

  @ManyToOne(() => LibraryModel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "library_id" })
  library!: LibraryModel;

  @ManyToOne(() => CollectionModel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "collection_id" })
  collection!: CollectionModel;
}
