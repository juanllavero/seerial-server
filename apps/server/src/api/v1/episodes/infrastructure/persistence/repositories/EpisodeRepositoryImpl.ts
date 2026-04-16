import { v4 as uuidv4 } from "uuid";
import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import { BadRequestException } from "@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions";
import { VideoModel } from "@/api/v1/videos/infrastructure/persistence/models/VideoModel";
import { GenericRepositoryHelper } from "@/helpers/GenericRepositoryHelper";
import type { EpisodeRepositoryPort } from "../../../application/ports/EpisodeRepositoryPort";
import type { Episode } from "../../../domain/Episode";
import { EpisodeModel } from "../models/EpisodeModel";

export class EpisodeRepositoryImpl
	extends BaseRepository
	implements EpisodeRepositoryPort
{
	// Generic helper for common CRUD operations
	private helper: GenericRepositoryHelper<EpisodeModel, Episode>;

	constructor() {
		super();

		// Initialize helper
		this.helper = new GenericRepositoryHelper(EpisodeModel, {
			entityName: "Episode",
			generateShortId: true,
		});
	}

	async findAllBySeasonId(seasonId: string): Promise<Episode[]> {
		const validatedId = this.validateId(seasonId, "Season ID");
		return this.helper.findManyByField("seasonId", validatedId);
	}

	async findById(episodeId: string): Promise<Episode | null> {
		const validatedId = this.validateId(episodeId, "Episode ID");
		return this.helper.findById(validatedId, {
			relations: ["video", "video.watchLists"],
		});
	}

	async findByVideoSrc(videoSrc: string): Promise<Episode | null> {
		if (!videoSrc)
			throw new BadRequestException("Video source path is required");

		const video = await VideoModel.findOne({ where: { fileSrc: videoSrc } });
		if (!video?.episodeId) return null;

		return this.helper.findById(video.episodeId);
	}

	async create(data: Partial<Episode>): Promise<Episode | null> {
		this.validateData(data, "Episode data");

		if (data.id) {
			const existing = await EpisodeModel.findOne({ where: { id: data.id } });
			if (existing) return existing as unknown as Episode;
		}

		const episodeData = {
			...data,
			id: data.id || uuidv4().split("-")[0],
		};

		return this.helper.create(episodeData, true);
	}

	async update(id: string, data: Partial<Episode>): Promise<Episode> {
		const validatedId = this.validateId(id, "Episode ID");
		this.validateData(data, "Update data");
		return this.helper.update(validatedId, data);
	}

	async delete(id: string): Promise<void> {
		const validatedId = this.validateId(id, "Episode ID");
		return this.helper.delete(validatedId);
	}
}
