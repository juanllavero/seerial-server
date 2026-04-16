import type { Episode } from "../../domain/Episode";

export interface EpisodeRepositoryPort {
	create(data: Partial<Episode>): Promise<Episode | null>;
	update(id: string, data: Partial<Episode>): Promise<Episode>;
	delete(id: string): Promise<void>;

	findAllBySeasonId(seasonId: string): Promise<Episode[]>;
	findById(episodeId: string): Promise<Episode | null>;
	findByVideoSrc(videoSrc: string): Promise<Episode | null>;
}
