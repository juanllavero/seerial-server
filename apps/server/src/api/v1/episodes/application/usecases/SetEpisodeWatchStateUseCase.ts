import type { ContinueWatchingRepositoryPort } from '@/api/v1/continue-watching/application/ports/ContinueWatchingRepositoryPort'; // Asumido
import type { SeasonsRepositoryPort } from '@/api/v1/seasons/application/ports/SeasonsRepositoryPort';
import type { SeriesRepositoryPort } from '@/api/v1/series/application/ports/SeriesRepositoryPort'; // Asumido
import { NotFoundException } from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import type { VideoRepositoryPort } from '@/api/v1/videos/application/ports/VideosRepositoryPort';
import type { WatchListRepositoryPort } from '@/api/v1/watch-lists/application/ports/WatchListRepositoryPort'; // Asumido
import { messages } from '@/config/messages';
import type { EpisodeRepositoryPort } from '../ports/EpisodeRepositoryPort';

export class SetEpisodeWatchStateUseCase {
  constructor(
    private episodeRepo: EpisodeRepositoryPort,
    private seasonRepo: SeasonsRepositoryPort,
    private seriesRepo: SeriesRepositoryPort,
    private videoRepo: VideoRepositoryPort,
    private watchListRepo: WatchListRepositoryPort,
    private continueWatchingRepo: ContinueWatchingRepositoryPort,
  ) {}

  async execute(episodeId: string, userId: string, state: boolean): Promise<void> {
    // 1. Get the needed data
    const episodeToUpdate = await this.episodeRepo.findById(episodeId);
    if (!episodeToUpdate) throw new NotFoundException(messages.errors.notFound.episode);

    const season = await this.seasonRepo.findById(episodeToUpdate.seasonId);
    if (!season) throw new NotFoundException(messages.errors.notFound.season);

    const series = await this.seriesRepo.findById(season.seriesId, 'few');
    if (!series || !series.seasons) throw new NotFoundException(messages.errors.notFound.series);

    // 2. Business logic
    const previousEpisodeId = await this.continueWatchingRepo.getCurrentEpisode(series.id);
    let nextEpisodeId: string | null = null;

    // Get and order all seasons and episodes
    const allSeasons = (
      await Promise.all(series.seasons.map((s) => this.seasonRepo.findById(s.id, 'all')))
    )
      .filter((s) => !!s)
      .sort((a, b) => a.seasonNumber - b.seasonNumber);

    for (const s of allSeasons) {
      const episodes = (await Promise.all(s.episodes.map((e) => this.episodeRepo.findById(e.id))))
        .filter((e) => !!e)
        .sort((a, b) => a.episodeNumber - b.episodeNumber);

      // Previous seasons
      if (s.seasonNumber < season.seasonNumber) {
        for (const e of episodes) {
          const video = await this.videoRepo.findByEpisodeId(e.id);
          if (!video) continue;
          await this.watchListRepo.addVideo(video.id, userId);
        }
        await this.watchListRepo.addSeason(s.id, userId);
        continue;
      }

      // Next seasons
      if (s.seasonNumber > season.seasonNumber) {
        for (const e of episodes) {
          const video = await this.videoRepo.findByEpisodeId(e.id);
          if (!video) continue;
          await this.watchListRepo.removeVideo(video.id, userId);
        }
        await this.watchListRepo.removeSeason(s.id, userId);
        continue;
      }

      // Current season
      let allWatchedThisSeason = true;
      for (let i = 0; i < episodes.length; i++) {
        const e = episodes[i];
        const video = await this.videoRepo.findByEpisodeId(e.id);
        if (!video) continue;

        if (e.episodeNumber < episodeToUpdate.episodeNumber) {
          await this.watchListRepo.addVideo(video.id, userId);
        } else if (e.episodeNumber === episodeToUpdate.episodeNumber) {
          if (state) {
            await this.watchListRepo.addVideo(video.id, userId);
          }
          if (state === false) {
            nextEpisodeId = e.id;
          } else {
            if (i < episodes.length - 1) {
              nextEpisodeId = episodes[i + 1].id;
            } else {
              // ... (logic to seach in next seasons)
            }
          }
        } else {
          await this.watchListRepo.removeVideo(video.id, userId);
        }

        const isWatched = await this.watchListRepo.isVideoWatched(video.id, userId);
        if (!isWatched) allWatchedThisSeason = false;
      }

      if (allWatchedThisSeason) {
        await this.watchListRepo.addSeason(s.id, userId);
      } else {
        await this.watchListRepo.removeSeason(s.id, userId);
      }
    }

    // 3. update continue watching
    await this.continueWatchingRepo.deleteAll(userId, series.id);

    if (previousEpisodeId) {
      const prevVideo = await this.videoRepo.findByEpisodeId(previousEpisodeId);
      if (prevVideo) {
        await this.continueWatchingRepo.delete(prevVideo.id, userId);
      }
    }

    if (!nextEpisodeId) {
      await this.watchListRepo.addSeries(series.id, userId);
    } else {
      await this.watchListRepo.removeSeries(series.id, userId);
      const nextVideo = await this.videoRepo.findByEpisodeId(nextEpisodeId);
      if (nextVideo) {
        await this.continueWatchingRepo.add(nextVideo.id, userId, series.id);
      }
    }
  }
}
