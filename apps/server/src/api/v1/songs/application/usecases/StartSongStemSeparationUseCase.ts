import { NotFoundException } from "@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions";
import { messages } from "@/config/messages";
import type {
	AudioProcessingServicePort,
	StemSeparationJob,
} from "../ports/AudioProcessingServicePort";
import type { SongsRepositoryPort } from "../ports/SongsRepositoryPort";

export class StartSongStemSeparationUseCase {
	constructor(
		private readonly songsRepo: SongsRepositoryPort,
		private readonly audioProcessingService: AudioProcessingServicePort,
	) {}

	async execute(songId: string): Promise<StemSeparationJob> {
		const song = await this.songsRepo.findById(songId);

		if (!song) {
			throw new NotFoundException(messages.errors.notFound.song);
		}

		return this.audioProcessingService.queueStemSeparation(
			songId,
			song.fileSrc,
		);
	}
}
