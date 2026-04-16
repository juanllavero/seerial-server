import {
	BaseEntity,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryColumn,
} from "typeorm";
import { LibraryModel } from "@/api/v1/libraries/infrastructure/persistence/models/LibraryModel";
import { UserModel } from "./UserModel";

@Entity({ name: "UserLibrary" })
export class UserLibraryModel extends BaseEntity {
	@PrimaryColumn({ type: "varchar", nullable: false })
	userId!: string;

	@PrimaryColumn({ type: "varchar", nullable: false })
	libraryId!: string;

	@ManyToOne(() => UserModel, { onDelete: "CASCADE" })
	@JoinColumn({ name: "user_id" })
	user?: UserModel;

	@ManyToOne(() => LibraryModel, { onDelete: "CASCADE" })
	@JoinColumn({ name: "library_id" })
	library?: LibraryModel;
}
