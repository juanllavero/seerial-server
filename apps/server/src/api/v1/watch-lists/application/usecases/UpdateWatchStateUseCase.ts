import { useCases } from '@/api/v1/shared/infrastructure/adapters/di/container';
import {
  BadRequestException,
  NotFoundException,
} from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import type { Video } from '@/api/v1/videos/domain/Video';
import { messages } from '@/config/messages';
import type { WatchList } from '../../domain/WatchList';
import type { WatchListRepositoryPort } from '../ports/WatchListRepositoryPort';

export class UpdateWatchStateUseCase {
  constructor(private watchListRepo: WatchListRepositoryPort) { }

  async execute(params: {
    videoId: string;
    timeWatched: number;
    watched: boolean;
    userId: string;
  }): Promise<void> {
    const { videoId, timeWatched, watched, userId } = params;

    if (videoId == null || timeWatched == null || watched == null || !userId) {
      throw new BadRequestException(messages.errors.validation.notEnoughParams);
    }

    const video = await useCases.getVideoById().execute(videoId);
    if (!video) throw new NotFoundException(messages.errors.notFound.video);

    if (video.episodeId) {
      const episode = await useCases.getEpisodeById().execute(video.episodeId);
      if (!episode) throw new NotFoundException(messages.errors.notFound.episode);

      const season = await useCases.getSeasonById().execute(episode.seasonId);
      if (!season) throw new NotFoundException(messages.errors.notFound.season);

      await useCases.setEpisodeWatchState().execute(episode.id, userId, watched);
    } else if (video.movieId) {
      const movie = await useCases.getMoviebyId().execute(video.movieId);
      if (!movie) throw new NotFoundException(messages.errors.notFound.movie);

      const allWatched =
        movie.videos.filter((v: Video) =>
          v.id === video.id
            ? watched
            : v.watchLists.filter((wl: WatchList) => wl.userId === userId).length > 0,
        ).length === movie.videos.length;

      if (allWatched) {
        await this.watchListRepo.addMovie(userId, movie.id);
      } else {
        const movieWatchListExists = await this.watchListRepo.isMovieWatched(movie.id, userId);
        if (movieWatchListExists) {
          await this.watchListRepo.removeMovie(userId, movie.id);
        }
      }

      if (watched) {
        await useCases.removeVideoFromContinueWatching().execute(video.id, userId);
      } else {
        await useCases.addVideoToContinueWatching().execute(video.id, userId, undefined, movie.id);
      }
    }

    // Ensure a watchList exists for the video
    await this.watchListRepo.addVideo(userId, videoId);

    // Update watch list entry with progress
    const watchList = await this.watchListRepo.findByVideoIdAndUserId(videoId, userId);
    if (watchList)
      await this.watchListRepo.update(watchList.id, {
        timeWatched,
        watched,
        lastWatched: new Date().toLocaleString(),
      } as Partial<WatchList>);

    // Here we could also persist video progress if needed
  }
}
