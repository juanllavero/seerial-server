import { v4 as uuidv4 } from "uuid";
import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import { GenericRepositoryHelper } from "@/helpers/GenericRepositoryHelper";
import logger from "@/utils/logger";
import type { PlayListRepositoryPort } from "../../../application/ports/PlayListRepositoryPort";
import type { PlayList } from "../../../domain/PlayList";
import { PlayListItemModel } from "../models/PlayListItemModel";
import { PlayListModel } from "../models/PlayListModel";

export class PlayListRepositoryImpl
	extends BaseRepository
	implements PlayListRepositoryPort
{
	// Generic helper for common CRUD operations
	private helper: GenericRepositoryHelper<PlayListModel, PlayList>;

	constructor() {
		super();

		// Initialize helper
		this.helper = new GenericRepositoryHelper(PlayListModel, {
			entityName: "PlayList",
			generateShortId: true,
		});
	}

	async findAll(): Promise<PlayList[]> {
		return this.helper.findAll({
			relations: ["songs"],
		});
	}

	async findById(id: string): Promise<PlayList | null> {
		const validatedId = this.validateId(id, "PlayList ID");
		return this.helper.findById(validatedId, {
			relations: ["songs"],
		});
	}

	async create(playList: PlayList): Promise<PlayList> {
		this.validateData(playList, "PlayList data");

		// Check if playlist already exists by ID
		if (playList.id) {
			const existingPlayList = await this.findById(playList.id);
			if (existingPlayList) {
				logger.info(`PlayList with ID ${playList.id} already exists`);
				return existingPlayList;
			}
		}

		// Generate UUID if it doesn't exist
		const dataToCreate = {
			...playList,
			id: playList.id || uuidv4().split("-")[0],
		};

		return this.helper.create(dataToCreate, true);
	}

	async update(id: string, data: Partial<PlayList>): Promise<PlayList> {
		const validatedId = this.validateId(id, "PlayList ID");
		this.validateData(data, "Update data");
		return this.helper.update(validatedId, data);
	}

	async delete(id: string): Promise<void> {
		const validatedId = this.validateId(id, "PlayList ID");
		return this.helper.delete(validatedId);
	}

	async addSongToPlaylist(playlistId: string, songId: string): Promise<void> {
		const validated = this.validateIds({ playlistId, songId });

		// Check if relation already exists
		const existingRelation = await PlayListItemModel.findOne({
			where: {
				playlistId: validated.playlistId,
				songId: validated.songId,
			},
		});

		if (existingRelation) {
			logger.info(`Song ${songId} is already in playlist ${playlistId}`);
			return;
		}

		// Create new relation
		const newRelationData = {
			playlistId: validated.playlistId,
			songId: validated.songId,
		};

		await this.helper.createRelationship(
			PlayListItemModel,
			newRelationData,
			true,
		);
	}

	async removeSongFromPlaylist(
		playlistId: string,
		songId: string,
	): Promise<void> {
		const validated = this.validateIds({ playlistId, songId });

		const whereCondition = {
			playlistId: validated.playlistId,
			songId: validated.songId,
		};

		await this.helper.deleteRelationship(PlayListItemModel, whereCondition);
	}
}
