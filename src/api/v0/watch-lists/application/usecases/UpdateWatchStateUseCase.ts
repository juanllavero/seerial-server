import { useCases } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { Video } from "@/api/v0/videos/domain/Video";
import { WatchList } from "../../domain/WatchList";
import { WatchListRepositoryPort } from "../ports/WatchListRepositoryPort";

export class UpdateWatchStateUseCase {
  private static findVideoById = useCases.getVideoById();
  private static findEpisodeById = useCases.getEpisodeById();
  private static findSeasonById = useCases.getSeasonById();
  private static findMovieById = useCases.getMoviebyId();
  private static setEpisodeWatchState = useCases.setEpisodeWatchState();
  private static addVideoToContinueWatching =
    useCases.addVideoToContinueWatching();

  constructor(private watchListRepo: WatchListRepositoryPort) {}

  async execute(params: {
    videoId: string;
    timeWatched: number;
    watched: boolean;
    userId: string;
  }): Promise<{ message: string }> {
    const { videoId, timeWatched, watched, userId } = params;

    if (videoId == null || timeWatched == null || watched == null || !userId) {
      throw new Error("Not enough parameters");
    }

    const video = await UpdateWatchStateUseCase.findVideoById.execute(videoId);
    if (!video) throw new Error("Video not found");

    if (video.episodeId) {
      const episode = await UpdateWatchStateUseCase.findEpisodeById.execute(
        video.episodeId
      );
      if (!episode) throw new Error("Episode not found");

      const season = await UpdateWatchStateUseCase.findSeasonById.execute(
        episode.seasonId
      );
      if (!season) throw new Error("Season not found");

      await UpdateWatchStateUseCase.setEpisodeWatchState.execute(
        episode.id,
        userId,
        watched
      );
    } else if (video.movieId) {
      const movie = await UpdateWatchStateUseCase.findMovieById.execute(
        video.movieId
      );
      if (!movie) throw new Error("Movie not found");

      if (watched) {
        await this.watchListRepo.addVideo(userId, video.id);
      } else {
        await this.watchListRepo.removeVideo(
          userId as unknown as number,
          video.id as unknown as number
        );
      }

      const allWatched =
        movie.videos.filter((v: Video) =>
          v.id === video.id
            ? watched
            : v.watchLists.filter((wl) => wl.id === userId).length > 0
        ).length === movie.videos.length;

      if (allWatched) {
        await this.watchListRepo.addMovie(userId, movie.id);
      } else {
        await this.watchListRepo.removeMovie(
          userId as unknown as number,
          movie.id as unknown as number
        );
      }

      await UpdateWatchStateUseCase.addVideoToContinueWatching.execute(
        video.id,
        userId,
        movie.id
      );
    }

    // Ensure a watchList exists for the video
    await this.watchListRepo.addVideo(userId, videoId);

    // Update watch list entry with progress
    const watchList = await this.watchListRepo.findByVideoId(videoId);
    if (watchList)
      await this.watchListRepo.update(watchList.id, {
        timeWatched,
        lastWatched: new Date().toLocaleString(),
      } as Partial<WatchList>);

    // Here we could also persist video progress if needed
    return { message: "Watch state updated" };
  }
}
