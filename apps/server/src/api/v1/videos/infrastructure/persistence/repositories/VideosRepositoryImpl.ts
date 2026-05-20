import { formatDate, type PlayBackInfo, type Video } from '@seerial/domain';
import { BaseRepository } from '@/api/v1/base-repository/BaseRepository';
import { useCases } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { getMediaInfo } from '@/api/v1/shared/infrastructure/adapters/ffmpeg/mediaInfo';
import { NotFoundException } from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { messages } from '@/config/messages';
import { GenericRepositoryHelper } from '@/helpers/GenericRepositoryHelper';
import { RelationshipCreationHelper } from '@/helpers/RelationshipCreationHelper';
import type { VideoRepositoryPort } from '../../../application/ports/VideosRepositoryPort';
import { VideoModel } from '../models/VideoModel';

export class VideosRepositoryImpl extends BaseRepository implements VideoRepositoryPort {
  // Generic helper for common CRUD operations
  private helper: GenericRepositoryHelper<VideoModel, Video>;

  // Helper for relationship-based creation
  private relationHelper: RelationshipCreationHelper<VideoModel, Video>;

  constructor() {
    super();

    // Initialize helpers
    this.helper = new GenericRepositoryHelper(VideoModel, {
      entityName: 'Video',
      generateShortId: true,
    });

    this.relationHelper = new RelationshipCreationHelper(
      VideoModel,
      'Video',
      this.findById.bind(this),
      true,
    );
  }

  //#region ==== BASIC CRUD OPERATIONS ====

  async findById(id: string): Promise<Video | null> {
    const validatedId = this.validateId(id, 'Video ID');
    return this.helper.findById(validatedId);
  }

  async create(video: Video): Promise<Video> {
    this.validateData(video, 'Video data');
    return this.helper.create(video, true);
  }

  async update(id: string, data: Partial<Video>): Promise<Video> {
    const validatedId = this.validateId(id, 'Video ID');
    this.validateData(data, 'Update data');
    return this.helper.update(validatedId, data);
  }

  async delete(id: string): Promise<void> {
    const validatedId = this.validateId(id, 'Video ID');
    return this.helper.delete(validatedId);
  }

  //#endregion

  //#region ==== FIND BY SPECIFIC FIELDS ====

  async findByEpisodeId(episodeId: string): Promise<Video | null> {
    const validatedId = this.validateId(episodeId, 'Episode ID');
    return this.helper.findByField('episodeId', validatedId, {
      relations: ['watchLists'],
    });
  }

  async findByMovieId(movieId: string): Promise<Video[]> {
    const validatedId = this.validateId(movieId, 'Movie ID');
    return this.helper.findManyByField('movieId', validatedId);
  }

  async findByExtraId(extraId: string): Promise<Video | null> {
    const validatedId = this.validateId(extraId, 'Extra ID');
    return this.helper.findByField('extraId', validatedId);
  }

  async findByPath(path: string): Promise<Video | null> {
    this.validateData(path, 'Video path');
    return this.helper.findByField('fileSrc', path);
  }

  //#endregion

  async getVideoPlaybackInfo(id: string): Promise<PlayBackInfo> {
    const validatedId = this.validateId(id, 'Video ID');

    const video = await this.helper.findByField('id', validatedId);
    if (!video) {
      throw new NotFoundException(messages.errors.notFound.video);
    }

    const playbackContext = video.movieId
      ? await this.buildMoviePlaybackContext(video.movieId)
      : await this.buildEpisodePlaybackContext(video.episodeId ?? '');

    const mediaInfo = await getMediaInfo(video.fileSrc);

    if (!mediaInfo) {
      throw new NotFoundException(messages.errors.notFound.mediaInfo);
    }

    return {
      ...playbackContext.videoInfo,
      mediaInfoData: mediaInfo,
      playBackConfig: playbackContext.playBackConfig,
    };
  }

  private async buildMoviePlaybackContext(movieId: string): Promise<{
    videoInfo: { title: string; subtitle: string; info: string };
    playBackConfig: {
      preferAudioLan: string;
      preferSubLan: string;
      subsMode: string;
    };
  }> {
    const movie = await useCases.getMoviebyId().execute(movieId);

    if (!movie) {
      throw new NotFoundException(messages.errors.notFound.movie);
    }

    const library = await useCases.getLibrary().execute(movie.libraryId);

    if (!library) {
      throw new NotFoundException(messages.errors.notFound.library);
    }

    return {
      videoInfo: {
        title: movie.name,
        subtitle: '',
        info: `(${formatDate(movie.year)})`,
      },
      playBackConfig: {
        preferAudioLan: library.preferAudioLan || '',
        preferSubLan: library.preferSubLan || '',
        subsMode: library.subsMode || 'autoSubs',
      },
    };
  }

  private async buildEpisodePlaybackContext(episodeId: string): Promise<{
    videoInfo: { title: string; subtitle: string; info: string };
    playBackConfig: {
      preferAudioLan: string;
      preferSubLan: string;
      subsMode: string;
    };
  }> {
    const episode = await useCases.getEpisodeById().execute(episodeId);

    if (!episode) {
      throw new NotFoundException(messages.errors.notFound.episode);
    }

    const season = await useCases.getSeasonById().execute(episode.seasonId);

    if (!season) {
      throw new NotFoundException(messages.errors.notFound.season);
    }

    const series = await useCases.getSeriesById().execute(season.seriesId);

    if (!series) {
      throw new NotFoundException(messages.errors.notFound.series);
    }

    return {
      videoInfo: {
        title: episode.name,
        subtitle: `${series.name} • ${season.name}`,
        info: `S${season.seasonNumber}E${episode.episodeNumber} • (${formatDate(episode.year)})`,
      },
      playBackConfig: {
        preferAudioLan: series.preferAudioLan || '',
        preferSubLan: series.preferSubLan || '',
        subsMode: series.subsMode || 'autoSubs',
      },
    };
  }

  //#region ==== RELATIONSHIP CREATION METHODS ====

  async addAsMovie(movieId: string, video?: Partial<Video>): Promise<Video | null> {
    const validatedId = this.validateId(movieId, 'Movie ID');
    return this.relationHelper.createWithRelation('movieId', validatedId, video);
  }

  async addAsMovieExtra(movieId: string, video?: Partial<Video>): Promise<Video | null> {
    const validatedId = this.validateId(movieId, 'Movie ID');
    return this.relationHelper.createWithRelation('extraId', validatedId, video);
  }

  async addAsEpisode(episodeId: string, video?: Partial<Video>): Promise<Video | null> {
    const validatedId = this.validateId(episodeId, 'Episode ID');
    return this.relationHelper.createWithRelation('episodeId', validatedId, video);
  }

  //#endregion
}
